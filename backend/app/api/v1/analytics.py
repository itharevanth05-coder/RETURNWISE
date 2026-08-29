from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db.models import ReturnRequest, Decision, Product
from app.schemas.analytics import AnalyticsOverview, TimeSeriesTrend, CategoryDefectMetric

router = APIRouter()

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(db: Session = Depends(get_db)):
    """
    Get aggregated ReturnWise performance metrics, prevented losses,
    rule baseline comparisons, and defect trends.
    """
    returns = db.query(ReturnRequest).all()
    decisions = db.query(Decision).all()
    products = db.query(Product).all()

    total_processed = len(returns)
    legit_count = sum(1 for d in decisions if d.risk_category == "LEGITIMATE")
    abuse_count = sum(1 for d in decisions if d.risk_category == "POTENTIAL_ABUSE")
    uncertain_count = sum(1 for d in decisions if d.risk_category == "UNCERTAIN")

    total_baseline_loss = sum(d.baseline_expected_loss for d in decisions)
    total_returnwise_loss = sum(d.expected_loss_selected for d in decisions)
    total_loss_prevented = max(0.0, sum(d.loss_prevented for d in decisions))

    reduction_pct = 0.0
    if total_baseline_loss > 0:
        reduction_pct = round((total_loss_prevented / total_baseline_loss) * 100, 1)

    # Actions breakdown
    actions_breakdown = {
        "APPROVE": 0,
        "INSPECT": 0,
        "EXCHANGE": 0,
        "RESTRICT": 0,
        "ESCALATE": 0
    }
    for d in decisions:
        if d.selected_action in actions_breakdown:
            actions_breakdown[d.selected_action] += 1

    # Timeline trends grouped by date
    timeline_dict = defaultdict(lambda: {"total": 0, "abuse": 0, "legit": 0, "uncertain": 0, "saved": 0.0})
    for r in returns:
        date_str = r.request_date.strftime("%Y-%m-%d")
        timeline_dict[date_str]["total"] += 1
        if r.decision:
            if r.decision.risk_category == "POTENTIAL_ABUSE":
                timeline_dict[date_str]["abuse"] += 1
            elif r.decision.risk_category == "LEGITIMATE":
                timeline_dict[date_str]["legit"] += 1
            else:
                timeline_dict[date_str]["uncertain"] += 1
            timeline_dict[date_str]["saved"] += r.decision.loss_prevented

    timeline_trends = [
        TimeSeriesTrend(
            date=d,
            total_returns=vals["total"],
            abuse_returns=vals["abuse"],
            legitimate_returns=vals["legit"],
            uncertain_returns=vals["uncertain"],
            loss_prevented=round(vals["saved"], 2)
        )
        for d, vals in sorted(timeline_dict.items())
    ]

    # Category defect stats
    cat_dict = defaultdict(lambda: {"count": 0, "defect_sum": 0.0, "high_defect_batches": 0, "price_sum": 0.0})
    for p in products:
        cat_dict[p.category]["count"] += 1
        cat_dict[p.category]["defect_sum"] += p.batch_defect_rate
        cat_dict[p.category]["price_sum"] += p.price
        if p.batch_defect_rate >= 0.06:
            cat_dict[p.category]["high_defect_batches"] += 1

    category_defect_stats = [
        CategoryDefectMetric(
            category=cat,
            total_returns=sum(1 for r in returns if r.product.category == cat),
            defect_rate=round(vals["defect_sum"] / max(1, vals["count"]), 3),
            high_defect_batches=vals["high_defect_batches"],
            avg_price=round(vals["price_sum"] / max(1, vals["count"]), 2)
        )
        for cat, vals in cat_dict.items()
    ]

    return AnalyticsOverview(
        total_returns_processed=total_processed,
        legitimate_count=legit_count,
        potential_abuse_count=abuse_count,
        uncertain_count=uncertain_count,
        total_loss_prevented=round(total_loss_prevented, 2),
        expected_loss_reduction_pct=reduction_pct,
        total_baseline_loss=round(total_baseline_loss, 2),
        total_returnwise_loss=round(total_returnwise_loss, 2),
        actions_breakdown=actions_breakdown,
        timeline_trends=timeline_trends,
        category_defect_stats=category_defect_stats
    )

@router.get("/ml-metrics", summary="Model Evaluation & Reliability Report")
def get_ml_metrics():
    """
    Returns the real evaluation metrics, training dataset sizes, features,
    and performance report for all trained ML models and deterministic engines.
    """
    import json
    from pathlib import Path
    metrics_path = Path(__file__).resolve().parent.parent.parent / "ml" / "artifacts" / "metrics.json"
    if metrics_path.exists():
        with open(metrics_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"status": "Metrics report not found. Run app/ml/train.py to generate."}
