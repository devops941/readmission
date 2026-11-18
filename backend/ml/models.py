from typing import Any, Dict
from pathlib import Path
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from backend.config import settings

def create_model_instance(algorithm: str, random_seed: int = 42, use_class_weight: bool = True) -> Any:
    algo = algorithm.lower().strip()
    class_weight = "balanced" if use_class_weight else None
    
    if algo in ["logistic_regression", "logit"]:
        return LogisticRegression(
            C=1.0,
            max_iter=1000,
            class_weight=class_weight,
            random_state=random_seed
        )
    elif algo in ["random_forest", "rf"]:
        return RandomForestClassifier(
            n_estimators=60,
            max_depth=7,
            min_samples_leaf=10,
            class_weight=class_weight,
            random_state=random_seed,
            n_jobs=-1
        )
    elif algo in ["gradient_boosting", "gbm"]:
        # GradientBoostingClassifier does not take class_weight, so we fit normally
        return GradientBoostingClassifier(
            n_estimators=60,
            max_depth=4,
            learning_rate=0.1,
            subsample=0.85,
            random_state=random_seed
        )
    else:
        raise ValueError(f"Unsupported algorithm: {algorithm}. Supported: logistic_regression, random_forest, gradient_boosting")

def save_model_artifact(model_id: str, artifact: Dict[str, Any]) -> str:
    settings.ensure_directories()
    file_path = settings.MODEL_DIR / f"{model_id}.joblib"
    joblib.dump(artifact, file_path)
    return str(file_path)

def load_model_artifact(model_id: str) -> Dict[str, Any]:
    file_path = settings.MODEL_DIR / f"{model_id}.joblib"
    if not file_path.exists():
        raise FileNotFoundError(f"Model artifact not found for id {model_id}")
    return joblib.load(file_path)
