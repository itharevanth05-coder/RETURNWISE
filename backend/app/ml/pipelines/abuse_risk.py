import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any
from app.config import settings

ARTIFACT_PATH = Path(__file__).resolve().parent.parent / "artifacts" / "abuse_risk.joblib"

class ReturnAbuseRiskModel:
    """
    4. Return-Abuse Risk Model
    Ensemble / XGBoost risk estimator predicting overall probability of return abuse P(Abuse).
    Categorizes outcome into:
    - LEGITIMATE (P < 0.35)
    - UNCERTAIN (0.35 <= P <= 0.65)
    - POTENTIAL_ABUSE (P > 0.65)
    """

    def __init__(self):
        self.model_data = None
        if os.path.exists(ARTIFACT_PATH):
            try:
                self.model_data = joblib.load(ARTIFACT_PATH)
            except Exception:
                self.model_data = None

    def predict(
        self,
        features: Dict[str, Any],
        reason_res: Dict[str, Any],
        customer_res: Dict[str, Any],
        defect_res: Dict[str, Any]
    ) -> Dict[str, Any]:
        customer_risk = customer_res.get("customer_risk_score", 0.1)
        defect_prob = defect_res.get("defect_probability", 0.05)
        is_discrepancy = reason_res.get("is_discrepancy", False)
        
        days_since_delivery = features.get("days_since_delivery", 3)
        photos_provided = features.get("photos_provided", 0)
        high_ticket = features.get("high_ticket_flag", 0)
        is_high_shrink = features.get("is_high_shrink", 0)
        wardrobe_hits = features.get("wardrobe_keyword_hits", 0)

        # Baseline formulaic probability
        p_abuse = 0.85 * customer_risk
        p_abuse -= 0.25 * defect_prob

        # If XGBoost model is available, blend XGBoost probability prediction
        if self.model_data:
            try:
                clf = self.model_data["model"]
                feature_names = self.model_data["feature_names"]
                row_data = {
                    "return_rate": features.get("customer_return_rate", 0.1),
                    "wardrobe_score": features.get("wardrober_score", 0.0),
                    "wardrobe_flags": features.get("wardrobing_flags", 0),
                    "batch_defect_rate": features.get("batch_defect_rate", 0.02),
                    "price": features.get("price", 100.0),
                    "days_since_delivery": days_since_delivery,
                    "photos_provided": photos_provided
                }
                X_df = pd.DataFrame([row_data])[feature_names]
                xgb_prob = float(clf.predict_proba(X_df)[0][1])
                # Blend 50/50 with context prior
                p_abuse = 0.50 * p_abuse + 0.50 * xgb_prob
            except Exception:
                pass

        # Modifiers
        if is_discrepancy:
            p_abuse += 0.20
        if wardrobe_hits > 0:
            p_abuse += 0.15
        if days_since_delivery > 25:
            p_abuse += 0.08
        if photos_provided:
            p_abuse -= 0.05
        if high_ticket and is_high_shrink:
            p_abuse += 0.08

        # Clamp between 0.02 and 0.98
        p_abuse = min(0.98, max(0.02, p_abuse))

        # Assign 3-tier risk classification
        if p_abuse < settings.LEGITIMATE_THRESHOLD:
            risk_category = "LEGITIMATE"
        elif p_abuse > settings.ABUSE_THRESHOLD:
            risk_category = "POTENTIAL_ABUSE"
        else:
            risk_category = "UNCERTAIN"

        return {
            "abuse_probability": round(p_abuse, 3),
            "risk_category": risk_category,
            "risk_factors": {
                "customer_risk_component": round(0.85 * customer_risk, 3),
                "defect_mitigation_component": round(-0.25 * defect_prob, 3),
                "nlp_discrepancy_penalty": 0.20 if is_discrepancy else 0.0,
                "photo_credit": -0.05 if photos_provided else 0.0
            }
        }
