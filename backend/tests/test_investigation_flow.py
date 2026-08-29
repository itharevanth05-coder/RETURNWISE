import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.db.models import Customer, Product, Order, ReturnRequest, Decision, AuditLog
from app.agent.investigator import AutonomousReturnInvestigator

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    # Create dummy entities
    cust = Customer(
        customer_ref="TEST-CUST-1",
        name="Alice Walker",
        email="alice@example.com",
        total_orders=10,
        total_spend=1200.0,
        total_returns=1,
        return_rate=0.10,
        wardrobing_flag_count=0,
        serial_wardrober_score=0.05,
        ltv_tier="STANDARD"
    )
    prod = Product(
        product_ref="TEST-PROD-1",
        title="Ergonomic Keyboard",
        category="Electronics",
        price=150.0,
        cost_price=60.0,
        historical_return_rate=0.05,
        batch_defect_rate=0.01,
        batch_number="BATCH-1",
        is_high_shrink=False,
        requires_serial_check=False,
        expected_salvage_rate=0.70
    )
    db.add(cust)
    db.add(prod)
    db.flush()

    order = Order(
        order_ref="TEST-ORD-1",
        customer_id=cust.id,
        total_amount=150.0
    )
    db.add(order)
    db.flush()

    ret = ReturnRequest(
        return_ref="TEST-RET-1",
        order_id=order.id,
        customer_id=cust.id,
        product_id=prod.id,
        days_since_delivery=3,
        stated_reason="CHANGED_MIND",
        customer_comment="Item not needed anymore",
        claimed_condition="UNOPENED",
        photos_provided=True
    )
    db.add(ret)
    db.commit()

    yield db
    db.close()

def test_investigation_and_rerun_flow(test_db):
    agent = AutonomousReturnInvestigator()
    ret = test_db.query(ReturnRequest).first()

    # 1. Initial Investigation
    res = agent.investigate(db=test_db, return_id=ret.id)
    assert res["risk_category"] == "LEGITIMATE"
    assert res["selected_action"] == "APPROVE"
    assert res["is_rerun"] is False

    # Check Decision record in DB
    decision = test_db.query(Decision).filter(Decision.return_id == ret.id).first()
    assert decision is not None
    assert decision.selected_action == "APPROVE"

    # Check initial audit log
    audit_logs = test_db.query(AuditLog).filter(AuditLog.return_id == ret.id).all()
    assert len(audit_logs) == 1
    assert audit_logs[0].action_type == "INITIAL_INVESTIGATION"

    # 2. Rerun Decision with Abuse History Override
    rerun_res = agent.investigate(
        db=test_db,
        return_id=ret.id,
        overrides={
            "override_customer_return_rate": 0.85,
            "merchant_notes": "Customer flagged for serial return abuse in sister store."
        },
        actor="MERCHANT_OPERATOR"
    )
    assert rerun_res["is_rerun"] is True
    # Verify abuse probability increased substantially from baseline
    assert rerun_res["abuse_probability"] > res["abuse_probability"]

    # Verify updated audit log count
    audit_logs_after = test_db.query(AuditLog).filter(AuditLog.return_id == ret.id).all()
    assert len(audit_logs_after) == 2
    assert audit_logs_after[1].action_type == "DECISION_RERUN"
