from pydantic import BaseModel
from typing import List, Dict, Any

class TimeSeriesTrend(BaseModel):
    date: str
    total_returns: int
    abuse_returns: int
    legitimate_returns: int
    uncertain_returns: int
    loss_prevented: float

class CategoryDefectMetric(BaseModel):
    category: str
    total_returns: int
    defect_rate: float
    high_defect_batches: int
    avg_price: float

class AnalyticsOverview(BaseModel):
    total_returns_processed: int
    legitimate_count: int
    potential_abuse_count: int
    uncertain_count: int
    total_loss_prevented: float
    expected_loss_reduction_pct: float
    total_baseline_loss: float
    total_returnwise_loss: float
    actions_breakdown: Dict[str, int]
    timeline_trends: List[TimeSeriesTrend]
    category_defect_stats: List[CategoryDefectMetric]
