from typing import Dict, Any

class RuleBaselineEngine:
    """
    Standard naive e-commerce return policy baseline.
    Used for measuring RETURNWISE ROI / Prevented Loss Reduction.
    """

    @staticmethod
    def evaluate_baseline(days_since_delivery: int, price: float, action_payoffs: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Industry-standard rule baseline:
        - If returned within 30 days and item < $200 -> Automatically APPROVE
        - If returned within 30 days and item >= $200 -> INSPECT
        - If returned after 30 days -> RESTRICT
        """
        if days_since_delivery > 30:
            baseline_action = "RESTRICT"
            rule_reason = "Exceeded 30-day standard return window."
        elif price >= 200.0:
            baseline_action = "INSPECT"
            rule_reason = "High-ticket item exceeding $200 threshold requires mandatory inspection."
        else:
            baseline_action = "APPROVE"
            rule_reason = "Standard eligible return under $200 within 30-day window."

        baseline_loss = action_payoffs[baseline_action]["direct_financial_loss"]
        baseline_weighted_loss = action_payoffs[baseline_action]["weighted_total_loss"]

        return {
            "baseline_action": baseline_action,
            "rule_reason": rule_reason,
            "baseline_direct_loss": baseline_loss,
            "baseline_weighted_loss": baseline_weighted_loss
        }
