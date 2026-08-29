import pytest
from app.ml.pipelines.reason_classifier import ReturnReasonClassifier
from app.ml.pipelines.customer_behavior import CustomerBehaviorModel
from app.ml.pipelines.product_defect import ProductDefectModel
from app.ml.pipelines.resale_value import ResaleValueModel
from app.ml.pipelines.abuse_risk import ReturnAbuseRiskModel

def test_reason_classifier_wardrobing_discrepancy():
    classifier = ReturnReasonClassifier()
    res = classifier.predict({
        "stated_reason": "DEFECTIVE",
        "customer_comment": "wore to wedding party on saturday night",
        "wardrobe_keyword_hits": 2,
        "defect_keyword_hits": 0
    })
    assert res["is_discrepancy"] is True
    assert res["inferred_category"] == "WARDROBING_SUSPICION"

def test_customer_behavior_model():
    model = CustomerBehaviorModel()
    res = model.predict({
        "customer_return_rate": 0.75,
        "wardrober_score": 0.85,
        "wardrobing_flags": 3,
        "total_orders": 12
    })
    assert res["customer_risk_score"] > 0.6
    assert res["customer_tier"] == "HIGH_ABUSE_VELOCITY"

def test_product_defect_model():
    model = ProductDefectModel()
    res = model.predict({
        "batch_defect_rate": 0.12,
        "historical_return_rate": 0.15,
        "defect_keyword_hits": 2,
        "stated_reason": "DEFECTIVE"
    })
    assert res["is_known_defective_batch"] is True
    assert res["defect_probability"] > 0.5

def test_resale_value_model():
    model = ResaleValueModel()
    res = model.predict({
        "price": 100.0,
        "cost_price": 40.0,
        "claimed_condition": "UNOPENED",
        "days_since_delivery": 2,
        "photos_provided": 1,
        "batch_defect_rate": 0.01,
        "is_high_shrink": 0
    })
    assert res["predicted_salvage_rate"] > 0.7
    assert res["estimated_salvage_value"] > 70.0

def test_abuse_risk_model():
    model = ReturnAbuseRiskModel()
    res = model.predict(
        features={
            "customer_return_rate": 0.85,
            "wardrober_score": 0.90,
            "wardrobing_flags": 4,
            "batch_defect_rate": 0.01,
            "price": 500.0,
            "days_since_delivery": 5,
            "photos_provided": 0,
            "high_ticket_flag": 1,
            "is_high_shrink": 0,
            "wardrobe_keyword_hits": 2
        },
        reason_res={"is_discrepancy": True},
        customer_res={"customer_risk_score": 0.9},
        defect_res={"defect_probability": 0.1}
    )
    assert res["abuse_probability"] > 0.7
    assert res["risk_category"] == "POTENTIAL_ABUSE"

def test_ml_metrics_endpoint():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    response = client.get("/ml-metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "return_abuse_xgboost" in data["models"]
    assert data["models"]["return_abuse_xgboost"]["accuracy"] >= 0.9
    assert "resale_value_regressor" in data["models"]
    assert data["models"]["resale_value_regressor"]["r2_score"] >= 0.8
