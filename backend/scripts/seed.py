import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import settings, BACKEND_DIR
from backend.db.mongo import ensure_indexes, get_database
from backend.db.repositories import (
    DatasetRepository,
    EncounterRepository,
    DataDictionaryRepository,
    CohortRepository,
    ModelRunRepository,
    ExplanationRepository,
    ExpertReviewRepository
)
from backend.data.dictionary import get_default_dictionary
from backend.data.synthetic import generate_synthetic_encounters, generate_messy_test_dataset
from backend.ml.splits import split_by_time
from backend.ml.features import prepare_features_and_pipeline
from backend.ml.models import create_model_instance, save_model_artifact
from backend.ml.evaluate import evaluate_model_performance
from backend.ml.calibrate import apply_post_hoc_calibration
from backend.ml.threshold import calculate_threshold_metrics
from backend.ml.decision_curve import calculate_decision_curve
from backend.explain.shap_explain import calculate_global_shap
from backend.explain.permutation import compute_permutation_importance
from backend.scripts.create_admin import seed_users

def seed_all():
    print("=== Starting ReadmitExplain AI Database Seed ===")
    ensure_indexes()
    
    # 1. Seed Users
    seed_users()
    
    dataset_repo = DatasetRepository()
    encounter_repo = EncounterRepository()
    dict_repo = DataDictionaryRepository()
    cohort_repo = CohortRepository()
    model_repo = ModelRunRepository()
    explain_repo = ExplanationRepository()
    review_repo = ExpertReviewRepository()

    # 2. Check or create primary dataset
    datasets = dataset_repo.list_all()
    primary_dataset = None
    for d in datasets:
        if "De-Identified" in d.get("name", ""):
            primary_dataset = d
            break

    if not primary_dataset:
        print("Creating primary synthetic dataset...")
        primary_dataset = dataset_repo.create({
            "name": "General Hospital Quality Inpatient Cohort (De-Identified)",
            "description": "12,000 synthetic de-identified acute adult inpatient encounters with realistic clinical trajectories and planted subgroup disparities.",
            "source_note": "Synthetic benchmark for healthcare quality and explainability research. Zero real PHI.",
            "de_identification_confirmed": True
        })
        dataset_id = primary_dataset["id"]
        
        # Initialize dictionary
        dict_items = get_default_dictionary()
        dict_repo.set_dictionary(dataset_id, dict_items)
        
        # Generate 12,000 synthetic records
        print("Generating 12,000 synthetic encounter records...")
        df_enc = generate_synthetic_encounters(n_samples=12000, seed=42)
        records = df_enc.replace({np.nan: None}).to_dict(orient="records")
        
        # Insert in chunks of 2,000
        chunk_size = 2000
        total_inserted = 0
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i+chunk_size]
            inserted = encounter_repo.insert_batch(dataset_id, chunk)
            total_inserted += inserted
            print(f"  Inserted {total_inserted} / {len(records)} encounters...")

        readmit_rate = round(float(df_enc["readmit_30d"].mean() * 100), 2)
        dataset_repo.update_stats(dataset_id, total_inserted, readmit_rate)
        print(f"Encounters seeded. Total: {total_inserted}, 30d Readmission Rate: {readmit_rate}%")
    else:
        dataset_id = primary_dataset["id"]
        print(f"Dataset already exists: {primary_dataset['name']} (ID: {dataset_id})")

    # 3. Save messy test CSV file for import testing
    data_dir = BACKEND_DIR / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    messy_csv_path = data_dir / "synthetic_messy.csv"
    if not messy_csv_path.exists():
        print(f"Saving test messy file to {messy_csv_path}...")
        df_messy = generate_messy_test_dataset(n_samples=200)
        df_messy.to_csv(messy_csv_path, index=False)
        print("Messy test file generated.")

    # 4. Check or train baseline models
    existing_models = model_repo.list_for_dataset(dataset_id)
    if not existing_models:
        print("Training baseline models (Gradient Boosting, Random Forest, Logistic Regression)...")
        records = encounter_repo.get_all_records(dataset_id)
        df = pd.DataFrame(records)
        dict_items = dict_repo.get_for_dataset(dataset_id)

        train_months = list(range(1, 19))
        calib_months = [19, 20, 21]
        test_months = [22, 23, 24]

        train_df, calib_df, test_df = split_by_time(df, train_months, calib_months, test_months)

        X_train, X_calib, X_test, y_train, y_calib, y_test, feature_names, preprocessor, feature_info = prepare_features_and_pipeline(
            train_df=train_df,
            calib_df=calib_df,
            test_df=test_df,
            dictionary_items=dict_items,
            scale_numeric=False
        )

        for algo_name, calib_meth in [("gradient_boosting", "isotonic"), ("random_forest", "isotonic"), ("logistic_regression", "sigmoid")]:
            print(f"  Training {algo_name}...")
            run_id = model_repo.create({
                "dataset_id": dataset_id,
                "algorithm": algo_name,
                "calibration_method": calib_meth,
                "use_class_weight": True,
                "train_months": train_months,
                "calib_months": calib_months,
                "test_months": test_months,
                "random_seed": 42,
                "created_by": settings.ADMIN_EMAIL,
                "status": "training"
            })

            base_model = create_model_instance(algo_name, random_seed=42, use_class_weight=True)
            base_model.fit(X_train, y_train)

            cal_model, uncal_eval, cal_eval = apply_post_hoc_calibration(
                base_model, X_calib, y_calib, X_test, y_test, method=calib_meth, seed=42
            )

            y_probs = cal_model.predict_proba(X_test)[:, 1]
            threshold_metrics = calculate_threshold_metrics(y_test, y_probs)
            decision_curves = calculate_decision_curve(y_test, y_probs)

            # Global SHAP & Permutation (speed-optimized for seed)
            print(f"    Computing explanations for {algo_name}...", flush=True)
            shap_res = calculate_global_shap(base_model, X_test, feature_names, max_samples=100, seed=42)
            perm_res = compute_permutation_importance(base_model, X_test, y_test, feature_names, n_repeats=2, seed=42)

            # Artifact
            artifact = {
                "model_id": run_id,
                "base_model": base_model,
                "calibrated_model": cal_model,
                "preprocessor": preprocessor,
                "feature_names": feature_names,
                "algorithm": algo_name,
                "feature_info": feature_info,
                "train_months": train_months,
                "calib_months": calib_months,
                "test_months": test_months
            }
            artifact_path = save_model_artifact(run_id, artifact)

            explain_repo.upsert_for_model(run_id, {
                "base_value": shap_res["base_value"],
                "global_importance": shap_res["global_importance"],
                "beeswarm_data": shap_res["beeswarm_data"],
                "permutation_importance": perm_res
            })

            model_repo.update_status(run_id, "active" if algo_name == "gradient_boosting" else "candidate", result={
                "metrics": cal_eval,
                "uncalibrated_metrics": uncal_eval,
                "calibrated_metrics": cal_eval,
                "threshold_metrics": threshold_metrics,
                "decision_curves": decision_curves,
                "feature_info": feature_info,
                "artifact_path": artifact_path,
                "feature_names": feature_names,
                "n_train": len(train_df),
                "n_calib": len(calib_df),
                "n_test": len(test_df)
            })

            # Add sample review to the primary model
            if algo_name == "gradient_boosting":
                review_repo.create({
                    "model_id": run_id,
                    "target_type": "global_driver",
                    "target_id": "prior_admissions_6m",
                    "verdict": "agree",
                    "comment": "Prior admissions is strongly supported by hospital quality literature as an indicator of post-discharge instability.",
                    "reviewer_name": "Dr. Sarah Mitchell, MD",
                    "reviewer_role": "Clinical Reviewer"
                })
                review_repo.create({
                    "model_id": run_id,
                    "target_type": "global_driver",
                    "target_id": "followup_scheduled",
                    "verdict": "agree",
                    "comment": "Scheduled follow-up shows expected protective association across service lines.",
                    "reviewer_name": "Dr. Sarah Mitchell, MD",
                    "reviewer_role": "Clinical Reviewer"
                })
                print(f"  {algo_name} trained and set as ACTIVE (AUROC: {cal_eval['auroc']:.3f}, ECE: {cal_eval['ece']:.4f})")
    else:
        print(f"Models already exist ({len(existing_models)} runs).")

    # 5. Cohorts
    existing_cohorts = cohort_repo.list_for_dataset(dataset_id)
    if not existing_cohorts:
        cohort_repo.create(dataset_id, "High Prior Utilization (>= 2 Admissions)", {"prior_admissions_6m": {"$gte": 2}}, "analyst@readmitexplain.local")
        cohort_repo.create(dataset_id, "Cardiorespiratory Inpatients", {"primary_dx_group": {"$in": ["Circulatory", "Respiratory"]}}, "analyst@readmitexplain.local")
        cohort_repo.create(dataset_id, "Older Medicaid Patients (Age >= 65)", {"age": {"$gte": 65}, "insurance": "Medicaid"}, "analyst@readmitexplain.local")
        print("Seeded 3 research cohorts.")

    print("=== Database Seed Complete! ===")

if __name__ == "__main__":
    seed_all()
