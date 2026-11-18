from typing import Tuple, List, Dict, Any
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

def split_by_time(
    df: pd.DataFrame,
    train_months: List[int],
    calib_months: List[int],
    test_months: List[int]
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    if "discharge_month" not in df.columns:
        raise ValueError("Time-based split requires 'discharge_month' column.")
    
    train_df = df[df["discharge_month"].isin(train_months)].copy()
    calib_df = df[df["discharge_month"].isin(calib_months)].copy()
    test_df = df[df["discharge_month"].isin(test_months)].copy()
    
    return train_df, calib_df, test_df

def split_stratified_random(
    df: pd.DataFrame,
    test_size: float = 0.20,
    calib_size: float = 0.15,
    seed: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    if "readmit_30d" not in df.columns:
        raise ValueError("Stratified split requires 'readmit_30d' column.")
    
    train_val, test_df = train_test_split(
        df,
        test_size=test_size,
        stratify=df["readmit_30d"],
        random_state=seed
    )
    
    # Adjust calib size relative to remaining train_val
    relative_calib = calib_size / (1.0 - test_size)
    train_df, calib_df = train_test_split(
        train_val,
        test_size=relative_calib,
        stratify=train_val["readmit_30d"],
        random_state=seed
    )
    
    return train_df.copy(), calib_df.copy(), test_df.copy()
