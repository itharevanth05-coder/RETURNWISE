from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class ReturnRequestBase(BaseModel):
    order_id: int
    customer_id: int
    product_id: int
    stated_reason: str
    customer_comment: Optional[str] = None
    claimed_condition: str = "UNOPENED"
    days_since_delivery: int = 3
    photos_provided: bool = False

class ReturnRequestCreate(BaseModel):
    order_id: Optional[int] = 1
    customer_id: Optional[int] = None
    product_id: Optional[int] = None
    stated_reason: str = "DEFECTIVE"
    customer_comment: Optional[str] = None
    claimed_condition: str = "UNOPENED"
    days_since_delivery: int = 3
    photos_provided: bool = False
    
    # Custom Idea / Scenario Creation fields:
    custom_customer_name: Optional[str] = None
    custom_customer_return_rate: Optional[float] = None
    custom_wardrober_score: Optional[float] = None
    custom_product_title: Optional[str] = None
    custom_product_category: Optional[str] = None
    custom_product_price: Optional[float] = None
    custom_batch_defect_rate: Optional[float] = None

class ProductSummary(BaseModel):
    id: int
    product_ref: str
    title: str
    category: str
    price: float
    cost_price: float
    batch_defect_rate: float
    is_high_shrink: bool
    batch_number: Optional[str] = None
    vendor_id: Optional[str] = None

class CustomerSummary(BaseModel):
    id: int
    customer_ref: str
    name: str
    email: str
    total_orders: int
    total_returns: int
    return_rate: float
    serial_wardrober_score: float
    ltv_tier: str

class DecisionSummary(BaseModel):
    id: int
    risk_category: str
    abuse_probability: float
    defect_probability: float
    selected_action: str
    expected_loss_selected: float
    baseline_action: str
    baseline_expected_loss: float
    loss_prevented: float
    reasoning_summary: str
    created_at: datetime

class ReturnRequestListItem(BaseModel):
    id: int
    return_ref: str
    request_date: datetime
    stated_reason: str
    customer_comment: Optional[str] = None
    claimed_condition: str
    days_since_delivery: int
    photos_provided: bool
    status: str
    
    # Associated summaries
    customer: CustomerSummary
    product: ProductSummary
    decision: Optional[DecisionSummary] = None

    class Config:
        from_attributes = True

class ReturnRequestDetail(ReturnRequestListItem):
    pass

class ReturnChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ReturnChatRequest(BaseModel):
    messages: List[ReturnChatMessage]
    photo_summary: Optional[str] = None

class ReturnChatResponse(BaseModel):
    reply: str
    suggested_questions: List[str]

