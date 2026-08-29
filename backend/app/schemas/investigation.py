from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class EvidenceItem(BaseModel):
    category: str  # "CUSTOMER_BEHAVIOR", "PRODUCT_DEFECT", "RETURN_TIMING", "TEXT_SEMANTICS"
    title: str
    description: str
    severity: str  # "HIGH", "MEDIUM", "LOW", "NEUTRAL"
    impact: str    # "ABUSE_INDICATOR", "LEGITIMACY_INDICATOR", "NEUTRAL"

class ActionPayoffItem(BaseModel):
    action: str
    direct_financial_loss: float
    customer_friction_score: float
    weighted_total_loss: float
    description: str

class InvestigationResponse(BaseModel):
    return_id: int
    return_ref: str
    risk_category: str  # "LEGITIMATE", "POTENTIAL_ABUSE", "UNCERTAIN"
    abuse_probability: float
    defect_probability: float
    predicted_salvage_rate: float
    
    # Financial metrics
    selected_action: str  # APPROVE, INSPECT, EXCHANGE, RESTRICT, ESCALATE
    expected_loss_selected: float
    baseline_action: str
    baseline_expected_loss: float
    loss_prevented: float
    
    # Detailed Decision Support
    reasoning_summary: str
    detailed_explanation: str
    evidence_list: List[EvidenceItem]
    payoff_matrix: Dict[str, ActionPayoffItem]
    
    # Audit status
    investigated_at: datetime
    is_rerun: bool = False

class RerunDecisionRequest(BaseModel):
    override_customer_return_rate: Optional[float] = None
    override_batch_defect_rate: Optional[float] = None
    override_stated_reason: Optional[str] = None
    override_inspection_cost: Optional[float] = None
    merchant_notes: Optional[str] = None
