from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import ReturnRequest, Customer, Product, Decision
from app.agent.action_simulator import ActionSimulator
from app.schemas.simulation import SimulationRequest, SimulationResponse

router = APIRouter()

@router.post("", response_model=SimulationResponse)
def simulate_scenario(req: SimulationRequest, db: Session = Depends(get_db)):
    """
    Run what-if scenario simulations with modified cost parameters, friction weights,
    and counterfactual risk probabilities.
    """
    return_req = db.query(ReturnRequest).filter(ReturnRequest.id == req.return_id).first()
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found")

    customer = return_req.customer
    product = return_req.product
    decision = db.query(Decision).filter(Decision.return_id == req.return_id).first()

    current_action = decision.selected_action if decision else "APPROVE"
    current_loss = decision.expected_loss_selected if decision else product.price

    p_abuse = req.hypothetical_p_abuse if req.hypothetical_p_abuse is not None else (decision.abuse_probability if decision else 0.2)
    p_defect = req.hypothetical_p_defect if req.hypothetical_p_defect is not None else (decision.defect_probability if decision else 0.05)
    salvage_rate = decision.predicted_salvage_rate if decision else product.expected_salvage_rate
    price = req.hypothetical_price if req.hypothetical_price is not None else product.price

    sim_res = ActionSimulator.simulate_scenario(
        price=price,
        cost_price=product.cost_price,
        p_abuse=p_abuse,
        p_defect=p_defect,
        salvage_rate=salvage_rate,
        stated_reason=return_req.stated_reason,
        current_action=current_action,
        current_loss=current_loss,
        customer_ltv=customer.total_spend or 250.0,
        inspection_cost=req.inspection_cost,
        escalation_cost=req.escalation_cost,
        friction_weight=req.friction_weight,
        requires_serial_check=product.requires_serial_check
    )

    return {
        "return_id": req.return_id,
        "original_action": current_action,
        "original_expected_loss": current_loss,
        "simulated_action": sim_res["simulated_action"],
        "simulated_expected_loss": sim_res["simulated_direct_loss"],
        "payoff_matrix": sim_res["payoff_matrix"],
        "delta_loss": sim_res["delta_loss"],
        "recommendation_changed": sim_res["recommendation_changed"],
        "scenario_notes": sim_res["scenario_notes"]
    }
