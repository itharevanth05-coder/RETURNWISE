import os
import joblib
import pandas as pd
from typing import Dict, Any
from pathlib import Path

ARTIFACT_PATH = Path(__file__).resolve().parent.parent / "artifacts" / "resale_value.joblib"

class ResaleValueModel:
    """
    5. Resale-Value Prediction Model
    Estimates salvage and secondary market resale recovery percentage
    given item category, condition, and packaging status.
    Uses trained Gradient Boosting Regressor with graceful domain rule fallback.
    """

    def __init__(self):
        self.model_data = None
        if os.path.exists(ARTIFACT_PATH):
            try:
                self.model_data = joblib.load(ARTIFACT_PATH)
            except Exception:
                self.model_data = None

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        price = float(features.get("price", 50.0))
        cost_price = float(features.get("cost_price", 25.0))
        condition = str(features.get("claimed_condition", "UNOPENED"))
        days_since_delivery = int(features.get("days_since_delivery", 3))
        photos_provided = int(features.get("photos_provided", 0))
        batch_defect_rate = float(features.get("batch_defect_rate", 0.02))
        is_high_shrink = features.get("is_high_shrink", 0)
        
        condition_score_map = {
            "UNOPENED": 1.0,
            "OPENED_LIKE_NEW": 0.8,
            "USED": 0.4,
            "DAMAGED": 0.2
        }
        cond_score = condition_score_map.get(condition, 0.6)

        predicted_salvage_rate = None

        # 1. Predict with trained Gradient Boosting Regressor if loaded
        if self.model_data:
            try:
                reg = self.model_data["model"]
                feature_names = self.model_data["feature_names"]
                row_data = {
                    "price": price,
                    "cost_price": cost_price,
                    "days_since_delivery": days_since_delivery,
                    "photos_provided": photos_provided,
                    "batch_defect_rate": batch_defect_rate,
                    "condition_score": cond_score
                }
                X_df = pd.DataFrame([row_data])[feature_names]
                pred_salvage = float(reg.predict(X_df)[0])
                predicted_salvage_rate = max(0.05, min(0.95, pred_salvage))
            except Exception:
                pass

        # 2. Fallback heuristic formula if ML model is unavailable
        if predicted_salvage_rate is None:
            condition_factors = {
                "UNOPENED": 0.85,
                "OPENED_LIKE_NEW": 0.65,
                "DAMAGED": 0.20,
                "USED": 0.35
            }
            base_salvage = condition_factors.get(condition, 0.50)
            age_penalty = min(0.25, days_since_delivery * 0.005)
            shrink_penalty = 0.08 if is_high_shrink else 0.0
            predicted_salvage_rate = max(0.10, base_salvage - age_penalty - shrink_penalty)

        estimated_salvage_value = round(predicted_salvage_rate * price, 2)

        return {
            "predicted_salvage_rate": round(predicted_salvage_rate, 3),
            "estimated_salvage_value": estimated_salvage_value,
            "resale_recovery_tier": "HIGH" if predicted_salvage_rate > 0.70 else ("MEDIUM" if predicted_salvage_rate > 0.40 else "LOW")
        }
