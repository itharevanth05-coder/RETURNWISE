from typing import Dict, Any, List
from app.config import settings

class ActionOptimizer:
    """
    Deterministic decision optimization layer.
    Ranks actions and selects the optimal action considering expected financial loss,
    customer friction, risk category, and stated reasons.
    """

    @staticmethod
    def optimize_decision(
        risk_category: str,
        p_abuse: float,
        p_defect: float,
        stated_reason: str,
        price: float,
        action_payoffs: Dict[str, Dict[str, Any]],
        requires_serial_check: bool = False
    ) -> Dict[str, Any]:
        """
        Ranks candidate actions deterministically.
        """
        # Sort actions primarily by weighted_total_loss
        sorted_actions = sorted(
            action_payoffs.values(),
            key=lambda x: x["weighted_total_loss"]
        )
        
        # Policy heuristics & guardrails:
        # 1. If defect probability is dominant (> 0.60) and reason is DEFECTIVE, EXCHANGE or APPROVE is optimal
        # 2. If requires_serial_check and p_abuse > 0.40, prioritize INSPECT over APPROVE
        # 3. If risk_category is POTENTIAL_ABUSE (p_abuse > 0.70) and customer LTV is low, RESTRICT or INSPECT
        # 4. If UNCERTAIN (0.35 <= p_abuse <= 0.65), prioritize INSPECT or ESCALATE depending on price
        
        if requires_serial_check and p_abuse > 0.35:
            # Serialized electronics must be inspected if any suspicion
            best_action_name = "INSPECT"
        elif stated_reason == "DEFECTIVE" and p_defect > 0.55 and p_abuse < 0.35:
            # High-confidence genuine defect
            best_action_name = "EXCHANGE" if action_payoffs["EXCHANGE"]["weighted_total_loss"] <= action_payoffs["APPROVE"]["weighted_total_loss"] else "APPROVE"
        elif risk_category == "POTENTIAL_ABUSE" and p_abuse > 0.75:
            best_action_name = "RESTRICT" if price < 150 else "INSPECT"
        elif risk_category == "UNCERTAIN":
            if price > 250:
                best_action_name = "ESCALATE"
            else:
                best_action_name = "INSPECT"
        else:
            # Default to lowest weighted total loss
            best_action_name = sorted_actions[0]["action"]

        chosen_action_data = action_payoffs[best_action_name]
        
        return {
            "optimal_action": best_action_name,
            "chosen_direct_loss": chosen_action_data["direct_financial_loss"],
            "chosen_weighted_loss": chosen_action_data["weighted_total_loss"],
            "ranked_actions": sorted_actions
        }
