from typing import Dict, Any, Optional
from app.engine.expected_loss import FinancialLossCalculator
from app.engine.action_optimizer import ActionOptimizer
from app.config import settings

class ActionSimulator:
    """
    Action & What-If Simulation Agent Module.
    Simulates counterfactual scenarios, policy shifts, and financial parameter adjustments.
    """

    @staticmethod
    def simulate_scenario(
        price: float,
        cost_price: float,
        p_abuse: float,
        p_defect: float,
        salvage_rate: float,
        stated_reason: str,
        current_action: str,
        current_loss: float,
        customer_ltv: float = 250.0,
        inspection_cost: float = settings.INSPECTION_COST_DEFAULT,
        escalation_cost: float = settings.ESCALATION_OVERHEAD_COST,
        friction_weight: float = settings.CUSTOMER_FRICTION_WEIGHT,
        requires_serial_check: bool = False
    ) -> Dict[str, Any]:
        """
        Runs mathematical recalculation under simulated parameters.
        """
        simulated_payoffs = FinancialLossCalculator.calculate_action_losses(
            price=price,
            cost_price=cost_price,
            p_abuse=p_abuse,
            p_defect=p_defect,
            salvage_rate=salvage_rate,
            customer_ltv=customer_ltv,
            inspection_cost=inspection_cost,
            escalation_cost=escalation_cost,
            friction_weight=friction_weight
        )

        # Risk category under simulated p_abuse
        if p_abuse < settings.LEGITIMATE_THRESHOLD:
            sim_risk_cat = "LEGITIMATE"
        elif p_abuse > settings.ABUSE_THRESHOLD:
            sim_risk_cat = "POTENTIAL_ABUSE"
        else:
            sim_risk_cat = "UNCERTAIN"

        optimization_res = ActionOptimizer.optimize_decision(
            risk_category=sim_risk_cat,
            p_abuse=p_abuse,
            p_defect=p_defect,
            stated_reason=stated_reason,
            price=price,
            action_payoffs=simulated_payoffs,
            requires_serial_check=requires_serial_check
        )

        sim_action = optimization_res["optimal_action"]
        sim_loss = optimization_res["chosen_direct_loss"]
        delta_loss = round(sim_loss - current_loss, 2)
        changed = (sim_action != current_action)

        if changed:
            scenario_notes = f"Simulated shift altered optimal recommendation from {current_action} to {sim_action} (Financial delta: {'+' if delta_loss > 0 else ''}${delta_loss})."
        else:
            scenario_notes = f"Optimal recommendation remains {current_action} under simulated parameters."

        return {
            "simulated_risk_category": sim_risk_cat,
            "simulated_action": sim_action,
            "simulated_direct_loss": sim_loss,
            "simulated_weighted_loss": optimization_res["chosen_weighted_loss"],
            "payoff_matrix": simulated_payoffs,
            "ranked_actions": optimization_res["ranked_actions"],
            "delta_loss": delta_loss,
            "recommendation_changed": changed,
            "scenario_notes": scenario_notes
        }
