from typing import List, Dict, Any, Tuple
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

def prepare_features_and_pipeline(
    train_df: pd.DataFrame,
    calib_df: pd.DataFrame,
    test_df: pd.DataFrame,
    dictionary_items: List[Dict[str, Any]],
    scale_numeric: bool = False
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, List[str], Pipeline, Dict[str, Any]]:
    
    # 1. Determine excluded columns and allowed features
    excluded_report = []
    feature_cols = []
    
    dict_map = {item["variable"]: item for item in dictionary_items}
    
    for col in train_df.columns:
        item = dict_map.get(col)
        if col in ["_id", "id", "dataset_id", "encounter_id", "days_to_readmit", "readmit_30d"]:
            excluded_report.append({"column": col, "reason": "Administrative ID or target variable exclusion"})
            continue
        if item:
            if item.get("leakage_flag"):
                excluded_report.append({"column": col, "reason": "Flagged as target leakage in data dictionary"})
                continue
            if item.get("role") in ["excluded", "label"]:
                excluded_report.append({"column": col, "reason": f"Role is '{item.get('role')}'"})
                continue
            if col == "discharge_month":
                # used for time splitting
                excluded_report.append({"column": col, "reason": "Time split index variable"})
                continue
            feature_cols.append(col)
        else:
            excluded_report.append({"column": col, "reason": "Unrecognized column not in data dictionary"})

    # 2. Identify numeric vs categorical
    num_cols = []
    cat_cols = []
    
    for col in feature_cols:
        if train_df[col].dtype in [np.float64, np.int64, np.int32, np.float32, "float64", "int64"]:
            num_cols.append(col)
        else:
            cat_cols.append(col)

    # 3. Build transformers
    num_steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale_numeric:
        num_steps.append(("scaler", StandardScaler()))
    num_pipe = Pipeline(num_steps)
    
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="missing")),
        ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipe, num_cols),
            ("cat", cat_pipe, cat_cols)
        ]
    )

    # 4. Fit strictly on train_df
    X_train = preprocessor.fit_transform(train_df[feature_cols])
    X_calib = preprocessor.transform(calib_df[feature_cols])
    X_test = preprocessor.transform(test_df[feature_cols])
    
    y_train = train_df["readmit_30d"].values.astype(int)
    y_calib = calib_df["readmit_30d"].values.astype(int)
    y_test = test_df["readmit_30d"].values.astype(int)
    
    # 5. Extract transformed feature names
    cat_ohe = preprocessor.named_transformers_["cat"].named_steps["ohe"]
    ohe_feature_names = cat_ohe.get_feature_names_out(cat_cols).tolist() if cat_cols else []
    all_feature_names = num_cols + ohe_feature_names
    
    info = {
        "candidate_features_count": len(feature_cols),
        "numeric_features": num_cols,
        "categorical_features": cat_cols,
        "encoded_feature_names": all_feature_names,
        "excluded_features": excluded_report
    }

    return X_train, X_calib, X_test, y_train, y_calib, y_test, all_feature_names, preprocessor, info
