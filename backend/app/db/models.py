import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_ref = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    account_created_at = Column(DateTime, default=datetime.datetime.utcnow)
    total_orders = Column(Integer, default=1)
    total_spend = Column(Float, default=0.0)
    total_returns = Column(Integer, default=0)
    return_rate = Column(Float, default=0.0)
    wardrobing_flag_count = Column(Integer, default=0)
    serial_wardrober_score = Column(Float, default=0.0)
    ltv_tier = Column(String(20), default="STANDARD")  # VIP, HIGH_VALUE, STANDARD, AT_RISK
    is_restricted = Column(Boolean, default=False)
    
    # Relationships
    orders = relationship("Order", back_populates="customer")
    returns = relationship("ReturnRequest", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_ref = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(50), index=True, nullable=False)  # Electronics, Apparel, Luxury, Home, Footwear
    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    historical_return_rate = Column(Float, default=0.08)
    batch_defect_rate = Column(Float, default=0.02)
    batch_number = Column(String(50), index=True, nullable=True)
    vendor_id = Column(String(50), index=True, nullable=True)
    is_high_shrink = Column(Boolean, default=False)  # High risk of resale/fraud
    requires_serial_check = Column(Boolean, default=False)
    expected_salvage_rate = Column(Float, default=0.60)  # Average resale value % if returned unopened/minor wear

    # Relationships
    returns = relationship("ReturnRequest", back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_ref = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="CREDIT_CARD")
    delivery_date = Column(DateTime, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    returns = relationship("ReturnRequest", back_populates="order")


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(Integer, primary_key=True, index=True)
    return_ref = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    request_date = Column(DateTime, default=datetime.datetime.utcnow)
    days_since_delivery = Column(Integer, default=3)
    stated_reason = Column(String(100), nullable=False)  # "DEFECTIVE", "DOES_NOT_FIT", "CHANGED_MIND", "NOT_AS_DESCRIBED", "WRONG_ITEM"
    customer_comment = Column(Text, nullable=True)
    claimed_condition = Column(String(50), default="UNOPENED")  # UNOPENED, OPENED_LIKE_NEW, DAMAGED, USED
    photos_provided = Column(Boolean, default=False)
    tracking_number = Column(String(100), nullable=True)
    status = Column(String(30), default="PENDING")  # PENDING, INVESTIGATED, RESOLVED, CLOSED

    # Relationships
    order = relationship("Order", back_populates="returns")
    customer = relationship("Customer", back_populates="returns")
    product = relationship("Product", back_populates="returns")
    decision = relationship("Decision", back_populates="return_request", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="return_request")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("return_requests.id"), unique=True, nullable=False)
    
    # ML & Classification Results
    risk_category = Column(String(30), nullable=False)  # LEGITIMATE, POTENTIAL_ABUSE, UNCERTAIN
    abuse_probability = Column(Float, nullable=False)   # 0.0 - 1.0
    defect_probability = Column(Float, nullable=False)  # 0.0 - 1.0
    predicted_salvage_rate = Column(Float, default=0.5) # 0.0 - 1.0
    
    # Financial Decision Engine Results
    selected_action = Column(String(30), nullable=False)  # APPROVE, INSPECT, EXCHANGE, RESTRICT, ESCALATE
    expected_loss_selected = Column(Float, nullable=False)
    expected_loss_approve = Column(Float, nullable=False)
    expected_loss_inspect = Column(Float, nullable=False)
    expected_loss_exchange = Column(Float, nullable=False)
    expected_loss_restrict = Column(Float, nullable=False)
    expected_loss_escalate = Column(Float, nullable=False)
    
    # Simple Rule Baseline Comparison
    baseline_action = Column(String(30), default="APPROVE")
    baseline_expected_loss = Column(Float, nullable=False)
    loss_prevented = Column(Float, nullable=False)  # baseline_expected_loss - expected_loss_selected
    
    # Structured Evidence & Explanation
    reasoning_summary = Column(Text, nullable=False)
    detailed_explanation = Column(Text, nullable=False)
    evidence_payload = Column(Text, nullable=True)  # JSON string of extracted signals
    payoff_matrix_payload = Column(Text, nullable=True)  # JSON string of payoff details
    ml_components_payload = Column(Text, nullable=True)  # JSON string of all 6 component outputs
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    return_request = relationship("ReturnRequest", back_populates="decision")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("return_requests.id"), nullable=False)
    action_type = Column(String(50), nullable=False)  # "INVESTIGATION_RUN", "DECISION_RERUN", "MANUAL_OVERRIDE"
    actor = Column(String(50), default="AUTONOMOUS_AGENT")
    previous_state = Column(Text, nullable=True)
    new_state = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    note = Column(Text, nullable=True)

    # Relationships
    return_request = relationship("ReturnRequest", back_populates="audit_logs")
