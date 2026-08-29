from typing import Dict, Any
from app.config import settings

class FinancialLossCalculator:
    """
    Deterministic Financial Calculation Engine.
    Strictly calculates mathematical financial metrics and expected loss values.
    NO LLM hallucinations in loss figures.
    """

    @staticmethod
    def calculate_action_losses(
        price: float,
        cost_price: float,
        p_abuse: float,
        p_defect: float,
        salvage_rate: float,
        customer_ltv: float = 250.0,
        inspection_cost: float = settings.INSPECTION_COST_DEFAULT,
        escalation_cost: float = settings.ESCALATION_OVERHEAD_COST,
        friction_weight: float = settings.CUSTOMER_FRICTION_WEIGHT
    ) -> Dict[str, Dict[str, Any]]:
        """
        Calculates the expected financial loss and customer friction for all candidate actions:
        - APPROVE
        - INSPECT
        - EXCHANGE
        - RESTRICT
        - ESCALATE
        """
        processing_cost = 4.50  # Fixed logistics / restocking warehouse intake cost
        
        # 1. APPROVE
        # If Abuse: company loses full price (fraudulent refund given, item stolen/fake/wardrobed)
        # If Legitimate: company refunds price, recovers salvage_value = salvage_rate * price
        loss_approve_if_abuse = price
        loss_approve_if_legit = price - (salvage_rate * price) + processing_cost
        exp_loss_approve = (p_abuse * loss_approve_if_abuse) + ((1.0 - p_abuse) * loss_approve_if_legit)
        friction_approve = 0.0  # Zero customer friction, instant refund

        # 2. INSPECT
        # Inspection catches 94% of abuse cases upon physical intake
        # If Abuse: 94% caught (loss is $0 + inspection cost), 6% missed (loss is price + inspection cost)
        # If Legitimate: verified, refunded, salvaged
        loss_inspect_if_abuse = 0.06 * price
        loss_inspect_if_legit = (price - (salvage_rate * price)) + processing_cost
        exp_loss_inspect = inspection_cost + (p_abuse * loss_inspect_if_abuse) + ((1.0 - p_abuse) * loss_inspect_if_legit)
        friction_inspect = 14.0  # Moderate friction (5-7 day delay for physical inspection)

        # 3. EXCHANGE
        # Merchant sends replacement unit instead of cash refund
        # Effective cost to merchant is cost_price rather than full retail price
        # High utility for defect/fit issues, deters cash-seeking wardrobers/fraudsters
        if p_defect > 0.4:
            # Highly legitimate defect: exchange satisfies customer completely
            exp_loss_exchange = cost_price + processing_cost
            friction_exchange = 6.0
        else:
            # Possible remorse or abuse: fraud deterrence savings
            exp_loss_exchange = cost_price + (p_abuse * 0.20 * price) + processing_cost
            friction_exchange = 10.0

        # 4. RESTRICT
        # Reject return or enforce strict in-store verification / store credit only
        # If Abuse: prevents fraudulent cash loss (saves 100% of price)
        # If Legitimate: high churn penalty based on customer lifetime value
        churn_probability = 0.40
        customer_churn_loss = customer_ltv * churn_probability
        admin_dispute_cost = 5.0
        exp_loss_restrict = ((1.0 - p_abuse) * customer_churn_loss) + admin_dispute_cost + (p_abuse * 2.0)
        friction_restrict = 45.0  # High friction / negative sentiment

        # 5. ESCALATE
        # Route to senior fraud analyst / dispute specialist
        # Resolves abuse with 98% accuracy, prevents customer churn through concierge handling
        exp_loss_escalate = escalation_cost + (p_abuse * 0.02 * price) + ((1.0 - p_abuse) * (price - (salvage_rate * price) + processing_cost))
        friction_escalate = 22.0  # Moderate delay for agent review

        actions = {
            "APPROVE": {
                "action": "APPROVE",
                "direct_financial_loss": round(exp_loss_approve, 2),
                "customer_friction_score": friction_approve,
                "weighted_total_loss": round(exp_loss_approve + (friction_weight * friction_approve), 2),
                "description": "Grant immediate full refund without prior physical inspection."
            },
            "INSPECT": {
                "action": "INSPECT",
                "direct_financial_loss": round(exp_loss_inspect, 2),
                "customer_friction_score": friction_inspect,
                "weighted_total_loss": round(exp_loss_inspect + (friction_weight * friction_inspect), 2),
                "description": "Require warehouse physical inspection and serial verification before refund."
            },
            "EXCHANGE": {
                "action": "EXCHANGE",
                "direct_financial_loss": round(exp_loss_exchange, 2),
                "customer_friction_score": friction_exchange,
                "weighted_total_loss": round(exp_loss_exchange + (friction_weight * friction_exchange), 2),
                "description": "Offer replacement item directly, protecting retail margin and resolving defect."
            },
            "RESTRICT": {
                "action": "RESTRICT",
                "direct_financial_loss": round(exp_loss_restrict, 2),
                "customer_friction_score": friction_restrict,
                "weighted_total_loss": round(exp_loss_restrict + (friction_weight * friction_restrict), 2),
                "description": "Decline cash refund; issue conditional store credit or enforce strict policy."
            },
            "ESCALATE": {
                "action": "ESCALATE",
                "direct_financial_loss": round(exp_loss_escalate, 2),
                "customer_friction_score": friction_escalate,
                "weighted_total_loss": round(exp_loss_escalate + (friction_weight * friction_escalate), 2),
                "description": "Route to fraud investigation specialist for manual case assessment."
            }
        }
        return actions
