from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
import pandas as pd
import numpy as np
from backend.schemas import ModelTrainRequest, CalibrateRequest
from backend.db.repositories import ModelRunRepository, EncounterRepository, DataDictionaryRepository, AuditLogRepository, ExplanationRepository
from backend.ml.splits import split_by_time, split_stratified_random
from backend.ml.features import prepare_features_and_pipeline
from backend.ml.models import create_model_instance, save_model_artifact, load_model_artifact
from backend.ml.evaluate import evaluate_model_performance
from backend.ml.calibrate import apply_post_hoc_calibration
from backend.ml.threshold import calculate_threshold_metrics
from backend.ml.decision_curve import calculate_decision_curve
from backend.explain.shap_explain import calculate_global_shap
from backend.explain.permutation import compute_permutation_importance
from backend.security import get_current_user

router = APIRouter(prefix="/models", tags=["Models"])
model_repo = ModelRunRepository()
encounter_repo = EncounterRepository()
dict_repo = DataDictionaryRepository()
audit_repo = AuditLogRepository()
explain_repo = ExplanationRepository()

def _execute_model_training_sync(dataset_id: str, run_id: str, req: ModelTrainRequest, user_email: str):
    try:
        # 1. Fetch encounters
        records = encounter_repo.get_all_records(dataset_id)
        if not records:
            model_repo.update_status(run_id, "failed", error="Dataset has no encounters")
            return
            
        df = pd.DataFrame(records)
        dict_items = dict_repo.get_for_dataset(dataset_id)
        
        # 2. Splits
        if "discharge_month" in df.columns:
            train_df, calib_df, test_df = split_by_time(
                df,
                train_months=req.train_months,
                calib_months=req.calib_months,
                test_months=req.test_months
            )
        else:
            train_df, calib_df, test_df = split_stratified_random(df, seed=req.random_seed)

        # 3. Features & Pipeline
        X_train, X_calib, X_test, y_train, y_calib, y_test, feature_names, preprocessor, feature_info = prepare_features_and_pipeline(
            train_df=train_df,
            calib_df=calib_df,
            test_df=test_df,
            dictionary_items=dict_items,
            scale_numeric=(req.algorithm == "logistic_regression")
        )

        # 4. Train base model
        base_model = create_model_instance(
            algorithm=req.algorithm,
            random_seed=req.random_seed,
            use_class_weight=req.use_class_weight
        )
        base_model.fit(X_train, y_train)

        # 5. Calibration
        calibrated_model, uncalibrated_eval, calibrated_eval = apply_post_hoc_calibration(
            base_model=base_model,
            X_calib=X_calib,
            y_calib=y_calib,
            X_test=X_test,
            y_test=y_test,
            method=req.calibration_method if req.calibration_method != "none" else "isotonic",
            seed=req.random_seed
        )

        active_eval = calibrated_eval if req.calibration_method != "none" else uncalibrated_eval
        active_model = calibrated_model if req.calibration_method != "none" else base_model
        
        # 6. Threshold Metrics & Decision Curves
        y_test_probs = active_model.predict_proba(X_test)[:, 1]
        threshold_metrics = calculate_threshold_metrics(y_test, y_test_probs)
        decision_curves = calculate_decision_curve(y_test, y_test_probs)

        # 7. Precompute Global SHAP & Permutation Importance
        shap_res = calculate_global_shap(
            base_model,
            X_test,
            feature_names,
            max_samples=250,
            seed=req.random_seed
        )
        perm_res = compute_permutation_importance(
            base_model,
            X_test,
            y_test,
            feature_names,
            n_repeats=3,
            seed=req.random_seed
        )

        # 8. Save Artifact
        artifact = {
            "model_id": run_id,
            "base_model": base_model,
            "calibrated_model": calibrated_model,
            "preprocessor": preprocessor,
            "feature_names": feature_names,
            "algorithm": req.algorithm,
            "feature_info": feature_info,
            "train_months": req.train_months,
            "calib_months": req.calib_months,
            "test_months": req.test_months
        }
        artifact_path = save_model_artifact(run_id, artifact)

        # 9. Store Explanations in DB
        explain_repo.upsert_for_model(run_id, {
            "base_value": shap_res["base_value"],
            "global_importance": shap_res["global_importance"],
            "beeswarm_data": shap_res["beeswarm_data"],
            "permutation_importance": perm_res
        })

        # 10. Update Model Run Document
        result_payload = {
            "metrics": active_eval,
            "uncalibrated_metrics": uncalibrated_eval,
            "calibrated_metrics": calibrated_eval,
            "threshold_metrics": threshold_metrics,
            "decision_curves": decision_curves,
            "feature_info": feature_info,
            "artifact_path": artifact_path,
            "feature_names": feature_names,
            "n_train": len(train_df),
            "n_calib": len(calib_df),
            "n_test": len(test_df)
        }
        model_repo.update_status(run_id, "completed", result=result_payload)
        audit_repo.log(user_email, "MODEL_TRAINED", {"model_id": run_id, "algorithm": req.algorithm})

    except Exception as e:
        import traceback
        traceback.print_exc()
        model_repo.update_status(run_id, "failed", error=str(e))

@router.post("/train")
def train_model(
    req: ModelTrainRequest,
    dataset_id: str = Query(...),
    background_tasks: BackgroundTasks = None,
    current_user: dict = Depends(get_current_user)
):
    run_doc = {
        "dataset_id": dataset_id,
        "algorithm": req.algorithm,
        "calibration_method": req.calibration_method,
        "use_class_weight": req.use_class_weight,
        "train_months": req.train_months,
        "calib_months": req.calib_months,
        "test_months": req.test_months,
        "random_seed": req.random_seed,
        "created_by": current_user["email"],
        "status": "training"
    }
    run_id = model_repo.create(run_doc)
    
    # Train immediately / synchronously so user sees results right away without delay
    _execute_model_training_sync(dataset_id, run_id, req, current_user["email"])
    
    return {"status": "completed", "model_id": run_id}

@router.get("")
def list_models(dataset_id: str = Query(...), current_user: dict = Depends(get_current_user)):
    return model_repo.list_for_dataset(dataset_id)

@router.get("/compare")
def compare_models(dataset_id: str = Query(...), current_user: dict = Depends(get_current_user)):
    models = model_repo.list_for_dataset(dataset_id)
    summary = []
    for m in models:
        metrics = m.get("metrics", {})
        summary.append({
            "model_id": m.get("id"),
            "algorithm": m.get("algorithm"),
            "calibration_method": m.get("calibration_method"),
            "status": m.get("status"),
            "auroc": metrics.get("auroc"),
            "auroc_ci": metrics.get("auroc_ci"),
            "auprc": metrics.get("auprc"),
            "brier_score": metrics.get("brier_score"),
            "ece": metrics.get("ece"),
            "created_at": m.get("created_at")
        })
    return summary

@router.get("/{model_id}")
def get_model(model_id: str, current_user: dict = Depends(get_current_user)):
    m = model_repo.get_by_id(model_id)
    if not m:
        raise HTTPException(status_code=404, detail="Model run not found")
    return m

@router.post("/{model_id}/status")
def set_model_status(
    model_id: str,
    status: str = Query(..., pattern="^(candidate|active|retired)$"),
    current_user: dict = Depends(get_current_user)
):
    model_repo.set_active_status(model_id, status)
    audit_repo.log(current_user["email"], "MODEL_STATUS_CHANGED", {"model_id": model_id, "new_status": status})
    return {"status": "updated", "model_id": model_id, "new_status": status}
