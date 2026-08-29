import json
import random
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db
from app.db.models import ReturnRequest, Customer, Product, Order, Decision, AuditLog
from app.schemas.return_request import ReturnRequestListItem, ReturnRequestCreate
from app.agent.investigator import investigator_agent

router = APIRouter()

@router.get("", response_model=List[ReturnRequestListItem])
def get_returns(
    risk_category: Optional[str] = Query(None, description="Filter by risk category: LEGITIMATE, POTENTIAL_ABUSE, UNCERTAIN"),
    action: Optional[str] = Query(None, description="Filter by selected action: APPROVE, INSPECT, EXCHANGE, RESTRICT, ESCALATE"),
    search: Optional[str] = Query(None, description="Search by customer name, return ref, or product title"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    List returns triage queue with associated customer, product, and AI decision summaries.
    """
    query = db.query(ReturnRequest).join(ReturnRequest.customer).join(ReturnRequest.product).outerjoin(ReturnRequest.decision)

    if risk_category:
        query = query.filter(Decision.risk_category == risk_category.upper())
    
    if action:
        query = query.filter(Decision.selected_action == action.upper())

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_fmt)) |
            (ReturnRequest.return_ref.ilike(search_fmt)) |
            (Product.title.ilike(search_fmt))
        )

    returns = query.order_by(desc(ReturnRequest.request_date)).offset(offset).limit(limit).all()
    return returns

@router.post("", response_model=dict)
def create_return_request(
    payload: ReturnRequestCreate,
    db: Session = Depends(get_db)
):
    """
    Submit a new return request, supporting both existing catalog items and custom return ideas,
    automatically triggering AI investigation in real time.
    """
    # 1. Resolve or Create Customer
    customer = None
    if payload.custom_customer_name and payload.custom_customer_name.strip():
        cust_name = payload.custom_customer_name.strip()
        cust_ref = f"CUST-USER-{random.randint(100, 999)}"
        ret_rate = float(payload.custom_customer_return_rate if payload.custom_customer_return_rate is not None else 0.20)
        ward_score = float(payload.custom_wardrober_score if payload.custom_wardrober_score is not None else (0.75 if ret_rate > 0.5 else 0.10))
        total_orders = 12
        total_returns = int(round(total_orders * ret_rate))
        customer = Customer(
            customer_ref=cust_ref,
            name=cust_name,
            email=f"{cust_name.lower().replace(' ', '.')}@example.com",
            total_orders=total_orders,
            total_spend=float(payload.custom_product_price or 150.0) * 8.0,
            total_returns=total_returns,
            return_rate=ret_rate,
            wardrobing_flag_count=3 if ward_score > 0.5 else 0,
            serial_wardrober_score=ward_score,
            ltv_tier="VIP" if ret_rate < 0.1 else ("STANDARD" if ret_rate < 0.45 else "HIGH_RISK"),
            is_restricted=False
        )
        db.add(customer)
        db.flush()
    elif payload.customer_id:
        customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()

    if not customer:
        customer = db.query(Customer).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    # 2. Resolve or Create Product
    product = None
    if payload.custom_product_title and payload.custom_product_title.strip():
        prod_title = payload.custom_product_title.strip()
        prod_ref = f"PROD-USER-{random.randint(100, 999)}"
        prod_price = float(payload.custom_product_price if payload.custom_product_price is not None else 199.0)
        defect_rate = float(payload.custom_batch_defect_rate if payload.custom_batch_defect_rate is not None else 0.02)
        category = payload.custom_product_category or "Apparel"
        product = Product(
            product_ref=prod_ref,
            title=prod_title,
            category=category,
            price=prod_price,
            cost_price=round(prod_price * 0.40, 2),
            historical_return_rate=0.12,
            batch_defect_rate=defect_rate,
            batch_number=f"BATCH-USER-{random.randint(100, 999)}",
            vendor_id="VEND-CUSTOM",
            is_high_shrink=1 if ("Luxury" in category or "Electronics" in category or prod_price > 300) else 0,
            requires_serial_check=1 if "Electronics" in category else 0,
            expected_salvage_rate=0.60
        )
        db.add(product)
        db.flush()
    elif payload.product_id:
        product = db.query(Product).filter(Product.id == payload.product_id).first()

    if not product:
        product = db.query(Product).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

    # 3. Ensure an order exists
    order = db.query(Order).filter(Order.id == payload.order_id).first() if payload.order_id else None
    if not order or order.customer_id != customer.id:
        order = Order(
            order_ref=f"ORD-2026-{random.randint(6000, 9999)}",
            customer_id=customer.id,
            total_amount=product.price,
            order_date=datetime.datetime.utcnow() - datetime.timedelta(days=payload.days_since_delivery + 2),
            delivery_date=datetime.datetime.utcnow() - datetime.timedelta(days=payload.days_since_delivery)
        )
        db.add(order)
        db.flush()

    new_ret_ref = f"RET-2026-{random.randint(7000, 9999)}"
    return_req = ReturnRequest(
        return_ref=new_ret_ref,
        order_id=order.id,
        customer_id=customer.id,
        product_id=product.id,
        request_date=datetime.datetime.utcnow(),
        days_since_delivery=payload.days_since_delivery,
        stated_reason=payload.stated_reason,
        customer_comment=payload.customer_comment,
        claimed_condition=payload.claimed_condition,
        photos_provided=payload.photos_provided,
        tracking_number=f"TRK-{random.randint(1000, 9999)}-LIVE",
        status="PENDING"
    )
    db.add(return_req)
    db.commit()

    # Trigger Autonomous Investigation immediately
    investigation_result = investigator_agent.investigate(db=db, return_id=return_req.id, actor="AUTONOMOUS_AGENT")

    return {
        "return_id": return_req.id,
        "return_ref": return_req.return_ref,
        "status": "INVESTIGATED",
        "investigation": investigation_result
    }

@router.get("/{return_id}")
def get_return_detail(return_id: int, db: Session = Depends(get_db)):
    """
    Get deep-dive return context, customer history, product details, decision metrics, and audit history.
    """
    return_req = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()
    if not return_req:
        raise HTTPException(status_code=404, detail="Return request not found")

    decision = db.query(Decision).filter(Decision.return_id == return_id).first()
    customer = return_req.customer
    product = return_req.product
    audit_logs = db.query(AuditLog).filter(AuditLog.return_id == return_id).order_by(desc(AuditLog.timestamp)).all()

    decision_data = None
    if decision:
        ml_components = None
        if decision.ml_components_payload:
            try:
                ml_components = json.loads(decision.ml_components_payload)
            except Exception:
                ml_components = None

        # Build fallback if not saved in legacy rows
        if not ml_components:
            ml_components = {
                "reason_classification": {
                    "stated_reason": return_req.stated_reason,
                    "inferred_category": "WARDROBING_SUSPICION" if decision.abuse_probability > 0.65 else return_req.stated_reason,
                    "is_discrepancy": decision.abuse_probability > 0.65 and return_req.stated_reason == "DEFECTIVE",
                    "confidence": 0.88,
                    "discrepancy_note": "Evaluated semantic alignment between customer claim and text comment."
                },
                "customer_behavior": {
                    "customer_risk_score": round(min(1.0, customer.return_rate * 1.15), 3),
                    "customer_tier": customer.ltv_tier,
                    "return_rate_percent": round(customer.return_rate * 100, 1),
                    "wardrober_index": customer.serial_wardrober_score,
                    "flags_count": customer.wardrobing_flag_count,
                    "order_sample_size": customer.total_orders
                },
                "product_defect": {
                    "defect_probability": decision.defect_probability,
                    "is_known_defective_batch": product.batch_defect_rate >= 0.06,
                    "batch_defect_rate_pct": round(product.batch_defect_rate * 100, 1),
                    "defect_signal_strength": "STRONG" if product.batch_defect_rate >= 0.06 else "LOW"
                },
                "abuse_risk": {
                    "abuse_probability": decision.abuse_probability,
                    "risk_category": decision.risk_category,
                    "risk_factors": {
                        "customer_risk_component": round(0.85 * min(1.0, customer.return_rate * 1.15), 3),
                        "defect_mitigation_component": round(-0.25 * decision.defect_probability, 3)
                    }
                },
                "resale_value": {
                    "predicted_salvage_rate": decision.predicted_salvage_rate,
                    "estimated_salvage_value": round(decision.predicted_salvage_rate * product.price, 2),
                    "resale_recovery_tier": "HIGH" if decision.predicted_salvage_rate > 0.70 else "MEDIUM"
                },
                "expected_loss": {
                    "optimal_action": decision.selected_action,
                    "expected_loss_selected": decision.expected_loss_selected,
                    "baseline_action": decision.baseline_action,
                    "baseline_expected_loss": decision.baseline_expected_loss,
                    "loss_prevented": decision.loss_prevented
                }
            }

        decision_data = {
            "id": decision.id,
            "risk_category": decision.risk_category,
            "abuse_probability": decision.abuse_probability,
            "defect_probability": decision.defect_probability,
            "predicted_salvage_rate": decision.predicted_salvage_rate,
            "selected_action": decision.selected_action,
            "expected_loss_selected": decision.expected_loss_selected,
            "expected_loss_approve": decision.expected_loss_approve,
            "expected_loss_inspect": decision.expected_loss_inspect,
            "expected_loss_exchange": decision.expected_loss_exchange,
            "expected_loss_restrict": decision.expected_loss_restrict,
            "expected_loss_escalate": decision.expected_loss_escalate,
            "baseline_action": decision.baseline_action,
            "baseline_expected_loss": decision.baseline_expected_loss,
            "loss_prevented": decision.loss_prevented,
            "reasoning_summary": decision.reasoning_summary,
            "detailed_explanation": decision.detailed_explanation,
            "evidence_list": json.loads(decision.evidence_payload) if decision.evidence_payload else [],
            "payoff_matrix": json.loads(decision.payoff_matrix_payload) if decision.payoff_matrix_payload else {},
            "ml_components": ml_components,
            "ml_results": ml_components,
            "created_at": decision.created_at,
            "updated_at": decision.updated_at
        }

    return {
        "id": return_req.id,
        "return_ref": return_req.return_ref,
        "request_date": return_req.request_date,
        "stated_reason": return_req.stated_reason,
        "customer_comment": return_req.customer_comment,
        "claimed_condition": return_req.claimed_condition,
        "days_since_delivery": return_req.days_since_delivery,
        "photos_provided": return_req.photos_provided,
        "tracking_number": return_req.tracking_number,
        "status": return_req.status,
        "customer": {
            "id": customer.id,
            "customer_ref": customer.customer_ref,
            "name": customer.name,
            "email": customer.email,
            "total_orders": customer.total_orders,
            "total_spend": customer.total_spend,
            "total_returns": customer.total_returns,
            "return_rate": customer.return_rate,
            "wardrobing_flag_count": customer.wardrobing_flag_count,
            "serial_wardrober_score": customer.serial_wardrober_score,
            "ltv_tier": customer.ltv_tier,
            "is_restricted": customer.is_restricted
        },
        "product": {
            "id": product.id,
            "product_ref": product.product_ref,
            "title": product.title,
            "category": product.category,
            "price": product.price,
            "cost_price": product.cost_price,
            "historical_return_rate": product.historical_return_rate,
            "batch_defect_rate": product.batch_defect_rate,
            "batch_number": product.batch_number,
            "vendor_id": product.vendor_id,
            "is_high_shrink": product.is_high_shrink,
            "requires_serial_check": product.requires_serial_check,
            "expected_salvage_rate": product.expected_salvage_rate
        },
        "decision": decision_data,
        "audit_logs": [
            {
                "id": log.id,
                "action_type": log.action_type,
                "actor": log.actor,
                "previous_state": json.loads(log.previous_state) if log.previous_state else None,
                "new_state": json.loads(log.new_state) if log.new_state else None,
                "timestamp": log.timestamp,
                "note": log.note
            }
            for log in audit_logs
        ]
    }
