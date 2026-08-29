from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum

class TargetStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    MISSING_NEEDS_COLLECTION = "MISSING_NEEDS_COLLECTION"
    DETERMINISTIC_CALCULATION = "DETERMINISTIC_CALCULATION"

@dataclass
class MLComponentSpec:
    component_id: int
    name: str
    description: str
    task_type: str  # Classification, Regression, Clustering/Anomaly, Deterministic
    required_features: List[str]
    target_name: Optional[str]
    target_status: TargetStatus
    notes: str

@dataclass
class PreprocessedSplit:
    X_train: Any
    X_val: Any
    X_test: Any
    y_train: Optional[Any] = None
    y_val: Optional[Any] = None
    y_test: Optional[Any] = None
    feature_names: List[str] = field(default_factory=list)

# Specification registry for the 6 ReturnWise ML & Analytics Components
COMPONENTS_SPEC: Dict[int, MLComponentSpec] = {
    1: MLComponentSpec(
        component_id=1,
        name="Return-Reason Classification & Discrepancy Detection",
        description="NLP and semantic classifier to verify whether customer claim aligns with commentary and item state.",
        task_type="Multi-class Classification / Discrepancy Detection",
        required_features=[
            "customer_comment", "stated_reason", "category",
            "claimed_condition", "days_since_delivery", "photos_provided"
        ],
        target_name="is_discrepancy / true_reason_category",
        target_status=TargetStatus.MISSING_NEEDS_COLLECTION,
        notes="Stated reasons and customer comments exist, but verified ground-truth post-audit reason labels need formal logging."
    ),
    2: MLComponentSpec(
        component_id=2,
        name="Customer Behavior Modeling",
        description="Behavioral risk scoring, wardrobing frequency index, velocity anomaly detection.",
        task_type="Risk Scoring / Clustering",
        required_features=[
            "customer_return_rate", "wardrober_score", "wardrobing_flags",
            "total_orders", "total_spend", "total_returns"
        ],
        target_name="customer_risk_tier / future_abuse_flag",
        target_status=TargetStatus.MISSING_NEEDS_COLLECTION,
        notes="Historical order/return counts exist in DB; gold longitudinal customer abuse labels require merchant history accumulation."
    ),
    3: MLComponentSpec(
        component_id=3,
        name="Product-Defect Pattern Detection",
        description="Batch defect rate clustering, vendor quality tracking, and defect probability estimation.",
        task_type="Anomaly Detection / Binary Classification",
        required_features=[
            "batch_defect_rate", "historical_return_rate", "category",
            "price", "batch_number", "vendor_id", "defect_keyword_hits"
        ],
        target_name="verified_batch_defect_flag",
        target_status=TargetStatus.MISSING_NEEDS_COLLECTION,
        notes="Batch defect rates and vendor IDs exist in product catalog; post-warehouse inspection physical defect confirmations are needed."
    ),
    4: MLComponentSpec(
        component_id=4,
        name="Return-Abuse Risk Prediction",
        description="Supervised ensemble model predicting overall probability of return abuse P(Abuse).",
        task_type="Binary Classification / Probability Calibration",
        required_features=[
            "customer_return_rate", "wardrober_score", "wardrobing_flags",
            "batch_defect_rate", "price", "days_since_delivery",
            "photos_provided", "category", "claimed_condition", "text_sentiment_score"
        ],
        target_name="is_abuse",
        target_status=TargetStatus.AVAILABLE,
        notes="Binary label 'is_abuse' is available in synthetic_returns.csv (2,000 samples)."
    ),
    5: MLComponentSpec(
        component_id=5,
        name="Resale-Value Prediction",
        description="Regression model estimating item salvage percentage and secondary market recovery.",
        task_type="Continuous Regression",
        required_features=[
            "price", "cost_price", "claimed_condition", "days_since_delivery",
            "category", "is_high_shrink"
        ],
        target_name="salvage_rate",
        target_status=TargetStatus.AVAILABLE,
        notes="Continuous target 'salvage_rate' (0.10 to 0.85) is available in synthetic_returns.csv."
    ),
    6: MLComponentSpec(
        component_id=6,
        name="Expected-Loss Estimation & Decision Optimizer",
        description="Deterministic mathematical payoff matrix calculator evaluating net loss and customer friction across 5 policies.",
        task_type="Deterministic Optimization",
        required_features=[
            "price", "cost_price", "p_abuse", "p_defect", "salvage_rate", "customer_ltv"
        ],
        target_name="N/A (Pure Mathematical Objective Function)",
        target_status=TargetStatus.DETERMINISTIC_CALCULATION,
        notes="Evaluates pure mathematical net expected loss across candidate actions. Does not use black-box ML training."
    )
}
