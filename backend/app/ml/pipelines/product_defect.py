from typing import Dict, Any

class ProductDefectModel:
    """
    3. Product-Defect Pattern Model
    Identifies batch-level manufacturing issues, vendor quality anomalies,
    and size discrepancy clusters.
    """

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        batch_defect_rate = features.get("batch_defect_rate", 0.02)
        historical_return_rate = features.get("historical_return_rate", 0.08)
        defect_keyword_hits = features.get("defect_keyword_hits", 0)
        stated_reason = features.get("stated_reason", "")
        
        # Anomaly threshold: Normal defect rate is 1-3%. >6% indicates bad batch.
        is_known_defective_batch = batch_defect_rate >= 0.06
        
        # Calculate defect probability for this specific return
        defect_prob = (0.50 * min(1.0, batch_defect_rate / 0.10)) + (0.30 * min(1.0, historical_return_rate / 0.20))
        if stated_reason == "DEFECTIVE":
            defect_prob += 0.20
        if defect_keyword_hits > 0:
            defect_prob += 0.15
            
        defect_prob = min(0.99, max(0.01, defect_prob))
        
        return {
            "defect_probability": round(defect_prob, 3),
            "is_known_defective_batch": is_known_defective_batch,
            "batch_defect_rate_pct": round(batch_defect_rate * 100, 1),
            "historical_product_return_rate_pct": round(historical_return_rate * 100, 1),
            "defect_signal_strength": "STRONG" if defect_prob > 0.60 else ("MODERATE" if defect_prob > 0.30 else "LOW")
        }
