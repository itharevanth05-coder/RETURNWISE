from typing import Dict, Any

class CustomerBehaviorModel:
    """
    2. Customer Behavior Model
    Scores historical return patterns, wardrobing frequency, bracket purchasing,
    and velocity anomaly scores.
    """

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        return_rate = features.get("customer_return_rate", 0.0)
        wardrober_score = features.get("wardrober_score", 0.0)
        wardrobing_flags = features.get("wardrobing_flags", 0)
        total_orders = features.get("total_orders", 1)
        
        # Calculate behavioral anomaly score (0.0 to 1.0)
        # Weight return rate velocity strongly
        return_rate_component = min(1.0, return_rate * 1.15) if return_rate > 0.30 else return_rate
        
        behavior_risk_score = (0.60 * return_rate_component) + (0.25 * wardrober_score) + (0.15 * min(1.0, wardrobing_flags * 0.35))
        behavior_risk_score = min(1.0, max(0.0, behavior_risk_score))
        
        if behavior_risk_score < 0.25:
            tier = "TRUSTED_BUYER"
        elif behavior_risk_score < 0.55:
            tier = "STANDARD_MONITORED"
        else:
            tier = "HIGH_ABUSE_VELOCITY"

        return {
            "customer_risk_score": round(behavior_risk_score, 3),
            "customer_tier": tier,
            "return_rate_percent": round(return_rate * 100, 1),
            "wardrober_index": round(wardrober_score, 2),
            "flags_count": wardrobing_flags,
            "order_sample_size": total_orders
        }
