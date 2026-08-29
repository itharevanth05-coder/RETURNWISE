import os
import joblib
from typing import Dict, Any
from pathlib import Path

ARTIFACT_PATH = Path(__file__).resolve().parent.parent / "artifacts" / "reason_classifier.joblib"

class ReturnReasonClassifier:
    """
    1. Return-Reason Classification Model
    Analyzes consistency between customer stated reason, freeform text comments, and item metadata.
    Detects mismatched claims using TF-IDF NLP inference + semantic heuristics.
    """

    def __init__(self):
        self.model_data = None
        if os.path.exists(ARTIFACT_PATH):
            try:
                self.model_data = joblib.load(ARTIFACT_PATH)
            except Exception:
                self.model_data = None

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        stated_reason = features.get("stated_reason", "CHANGED_MIND")
        comment = features.get("customer_comment", "")
        wardrobe_hits = features.get("wardrobe_keyword_hits", 0)
        defect_hits = features.get("defect_keyword_hits", 0)
        
        confidence = 0.85
        inferred_category = stated_reason
        is_discrepancy = False
        discrepancy_note = "Stated reason matches customer comments."

        # If trained NLP model is loaded and comment exists, evaluate NLP model
        if self.model_data and comment.strip():
            try:
                vec = self.model_data["vectorizer"]
                clf = self.model_data["model"]
                X = vec.transform([comment])
                pred_abuse = clf.predict(X)[0]
                if pred_abuse == 1 and stated_reason == "DEFECTIVE" and defect_hits == 0:
                    is_discrepancy = True
                    inferred_category = "WARDROBING_SUSPICION"
                    discrepancy_note = "NLP text model identified semantic wardrobing patterns in customer comments."
            except Exception:
                pass

        if not is_discrepancy:
            if stated_reason == "DEFECTIVE":
                if wardrobe_hits > 0 and defect_hits == 0:
                    inferred_category = "WARDROBING_SUSPICION"
                    is_discrepancy = True
                    confidence = 0.92
                    discrepancy_note = "Stated DEFECTIVE but comment references event wear / wardrobing cues."
                elif "fit" in comment or "size" in comment or "tight" in comment or "loose" in comment:
                    inferred_category = "DOES_NOT_FIT"
                    is_discrepancy = True
                    confidence = 0.88
                    discrepancy_note = "Stated DEFECTIVE but comment indicates sizing issue."
            elif stated_reason == "DOES_NOT_FIT":
                if defect_hits > 0:
                    inferred_category = "DEFECTIVE"
                    is_discrepancy = True
                    confidence = 0.82
                    discrepancy_note = "Stated DOES_NOT_FIT but comment describes product malfunction."

        return {
            "stated_reason": stated_reason,
            "inferred_category": inferred_category,
            "is_discrepancy": is_discrepancy,
            "confidence": confidence,
            "discrepancy_note": discrepancy_note
        }
