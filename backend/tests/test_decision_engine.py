import pytest
from app.engine.expected_loss import FinancialLossCalculator
from app.engine.rule_baseline import RuleBaselineEngine
from app.engine.action_optimizer import ActionOptimizer

def test_financial_loss_calculator_actions():
    # Test high abuse probability ($500 item, 90% abuse probability)
    payoffs = FinancialLossCalculator.calculate_action_losses(
        price=500.0,
        cost_price=200.0,
        p_abuse=0.90,
        p_defect=0.02,
        salvage_rate=0.60,
        customer_ltv=250.0,
        inspection_cost=15.0
    )

    assert "APPROVE" in payoffs
    assert "INSPECT" in payoffs
    assert "EXCHANGE" in payoffs
    assert "RESTRICT" in payoffs
    assert "ESCALATE" in payoffs

    # Approving high abuse should result in high direct loss
    assert payoffs["APPROVE"]["direct_financial_loss"] > payoffs["INSPECT"]["direct_financial_loss"]
    assert payoffs["APPROVE"]["customer_friction_score"] == 0.0
    assert payoffs["RESTRICT"]["customer_friction_score"] > 30.0

def test_rule_baseline_engine():
    payoffs = FinancialLossCalculator.calculate_action_losses(
        price=120.0,
        cost_price=50.0,
        p_abuse=0.10,
        p_defect=0.01,
        salvage_rate=0.70
    )

    # Return under 30 days and under $200 should baseline to APPROVE
    baseline = RuleBaselineEngine.evaluate_baseline(
        days_since_delivery=5,
        price=120.0,
        action_payoffs=payoffs
    )
    assert baseline["baseline_action"] == "APPROVE"

    # Return over 30 days should baseline to RESTRICT
    baseline_late = RuleBaselineEngine.evaluate_baseline(
        days_since_delivery=35,
        price=120.0,
        action_payoffs=payoffs
    )
    assert baseline_late["baseline_action"] == "RESTRICT"

def test_action_optimizer_high_abuse():
    payoffs = FinancialLossCalculator.calculate_action_losses(
        price=100.0,
        cost_price=40.0,
        p_abuse=0.85,
        p_defect=0.01,
        salvage_rate=0.50
    )
    opt = ActionOptimizer.optimize_decision(
        risk_category="POTENTIAL_ABUSE",
        p_abuse=0.85,
        p_defect=0.01,
        stated_reason="CHANGED_MIND",
        price=100.0,
        action_payoffs=payoffs
    )
    assert opt["optimal_action"] in ["RESTRICT", "INSPECT"]
