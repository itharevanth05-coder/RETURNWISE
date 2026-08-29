from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CustomerDetailSchema(BaseModel):
    id: int
    customer_ref: str
    name: str
    email: str
    account_created_at: datetime
    total_orders: int
    total_spend: float
    total_returns: int
    return_rate: float
    wardrobing_flag_count: int
    serial_wardrober_score: float
    ltv_tier: str
    is_restricted: bool

class ProductDetailSchema(BaseModel):
    id: int
    product_ref: str
    title: str
    category: str
    price: float
    cost_price: float
    historical_return_rate: float
    batch_defect_rate: float
    batch_number: Optional[str] = None
    vendor_id: Optional[str] = None
    is_high_shrink: bool
    requires_serial_check: bool
    expected_salvage_rate: float
