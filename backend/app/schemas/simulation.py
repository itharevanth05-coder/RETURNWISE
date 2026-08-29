from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class SimulationRequest(BaseModel):
    return_id: int
    inspection_cost: Optional[float] = 15.0
    friction_weight: Optional[float] = 0.4
    escalation_cost: Optional[float] = 25.0
    hypothetical_p_abuse: Optional[float] = None
    hypothetical_p_defect: Optional[float] = None
    hypothetical_price: Optional[float] = None

class SimulationResponse(BaseModel):
    return_id: int
    original_action: str
    original_expected_loss: float
    simulated_action: str
    simulated_expected_loss: float
    payoff_matrix: Dict[str, Any]
    delta_loss: float
    recommendation_changed: bool
    scenario_notes: str
