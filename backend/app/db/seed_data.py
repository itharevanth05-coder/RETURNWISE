import random
import datetime
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.db.models import Customer, Product, Order, ReturnRequest, Decision, AuditLog
from app.agent.investigator import investigator_agent

def seed_database():
    """
    Seeds realistic synthetic e-commerce returns data and executes initial investigations.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Ensure ml_components_payload column exists in SQLite table
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE decisions ADD COLUMN ml_components_payload TEXT;"))
            conn.commit()
    except Exception:
        pass
    
    db: Session = SessionLocal()
    
    # Check if already seeded
    if db.query(Customer).count() > 0:
        print("Database already contains data. Skipping seed.")
        db.close()
        return

    print("Generating synthetic customers, products, and return cases...")

    # 1. Create Products
    products_data = [
        # Serialized Electronics
        {"ref": "PROD-101", "title": "UltraHD 4K Noise-Cancelling Headphones", "cat": "Electronics", "price": 349.99, "cost": 140.0, "ret_rate": 0.12, "defect_rate": 0.03, "is_shrink": True, "serial": True, "batch": "BATCH-AUDIO-22", "salvage": 0.70},
        {"ref": "PROD-102", "title": "ProStream 4K Mirrorless Camera Body", "cat": "Electronics", "price": 1199.00, "cost": 650.0, "ret_rate": 0.15, "defect_rate": 0.08, "is_shrink": True, "serial": True, "batch": "BATCH-OPTIC-99", "salvage": 0.75},
        {"ref": "PROD-103", "title": "SmartHome Mesh WiFi 7 Router Tri-Band", "cat": "Electronics", "price": 289.50, "cost": 110.0, "ret_rate": 0.06, "defect_rate": 0.02, "is_shrink": False, "serial": True, "batch": "BATCH-NET-14", "salvage": 0.80},
        {"ref": "PROD-104", "title": "Precision Drone 4K with Gimbal & Sensor", "cat": "Electronics", "price": 799.00, "cost": 380.0, "ret_rate": 0.18, "defect_rate": 0.09, "is_shrink": True, "serial": True, "batch": "BATCH-AERO-05", "salvage": 0.55},
        {"ref": "PROD-105", "title": "Curved OLED 34-inch Gaming Monitor 240Hz", "cat": "Electronics", "price": 899.99, "cost": 490.0, "ret_rate": 0.22, "defect_rate": 0.14, "is_shrink": True, "serial": True, "batch": "BATCH-OLED-409", "salvage": 0.60},
        
        # Luxury Apparel & Wardrobing Targets
        {"ref": "PROD-201", "title": "Silk Velvet Evening Gala Dress (Midnight Black)", "cat": "Luxury Apparel", "price": 450.00, "cost": 90.0, "ret_rate": 0.28, "defect_rate": 0.01, "is_shrink": False, "serial": False, "batch": "BATCH-GALA-01", "salvage": 0.45},
        {"ref": "PROD-202", "title": "Italian Cashmere Overcoat (Camel)", "cat": "Luxury Apparel", "price": 850.00, "cost": 220.0, "ret_rate": 0.24, "defect_rate": 0.02, "is_shrink": False, "serial": False, "batch": "BATCH-COAT-09", "salvage": 0.50},
        {"ref": "PROD-203", "title": "Structured Wool Tailored Tuxedo Blazer", "cat": "Luxury Apparel", "price": 520.00, "cost": 130.0, "ret_rate": 0.31, "defect_rate": 0.01, "is_shrink": False, "serial": False, "batch": "BATCH-TUX-88", "salvage": 0.40},
        {"ref": "PROD-204", "title": "Floral Embroidered Cocktail Mini Dress", "cat": "Luxury Apparel", "price": 280.00, "cost": 65.0, "ret_rate": 0.35, "defect_rate": 0.02, "is_shrink": False, "serial": False, "batch": "BATCH-DRS-12", "salvage": 0.50},
        
        # Designer Handbags & Footwear
        {"ref": "PROD-301", "title": "Full-Grain Italian Leather Tote Bag", "cat": "Designer Handbags", "price": 380.00, "cost": 110.0, "ret_rate": 0.09, "defect_rate": 0.01, "is_shrink": True, "serial": False, "batch": "BATCH-BAG-04", "salvage": 0.80},
        {"ref": "PROD-302", "title": "Monogram Crossbody Shoulder Bag", "cat": "Designer Handbags", "price": 620.00, "cost": 180.0, "ret_rate": 0.14, "defect_rate": 0.02, "is_shrink": True, "serial": False, "batch": "BATCH-BAG-19", "salvage": 0.75},
        {"ref": "PROD-303", "title": "Carbon Fiber Marathon Running Shoes", "cat": "Footwear", "price": 240.00, "cost": 60.0, "ret_rate": 0.16, "defect_rate": 0.03, "is_shrink": False, "serial": False, "batch": "BATCH-SHOE-77", "salvage": 0.65},
        {"ref": "PROD-304", "title": "Handcrafted Goodyear-Welted Leather Chelsea Boots", "cat": "Footwear", "price": 310.00, "cost": 95.0, "ret_rate": 0.11, "defect_rate": 0.02, "is_shrink": False, "serial": False, "batch": "BATCH-BOOT-31", "salvage": 0.70},
        
        # Everyday Apparel & Home
        {"ref": "PROD-401", "title": "Supima Cotton Heavyweight Crewneck (Pack of 3)", "cat": "Apparel", "price": 75.00, "cost": 20.0, "ret_rate": 0.08, "defect_rate": 0.01, "is_shrink": False, "serial": False, "batch": "BATCH-TEE-02", "salvage": 0.85},
        {"ref": "PROD-402", "title": "Ergonomic Memory Foam Lumbar Support Chair", "cat": "Home & Office", "price": 360.00, "cost": 120.0, "ret_rate": 0.10, "defect_rate": 0.04, "is_shrink": False, "serial": False, "batch": "BATCH-FURN-55", "salvage": 0.50},
        {"ref": "PROD-403", "title": "Smart Barista Espresso Machine with Dual Boiler", "cat": "Home & Kitchen", "price": 699.00, "cost": 290.0, "ret_rate": 0.13, "defect_rate": 0.05, "is_shrink": False, "serial": True, "batch": "BATCH-CAFE-18", "salvage": 0.65},
    ]

    created_products = []
    for p in products_data:
        prod = Product(
            product_ref=p["ref"],
            title=p["title"],
            category=p["cat"],
            price=p["price"],
            cost_price=p["cost"],
            historical_return_rate=p["ret_rate"],
            batch_defect_rate=p["defect_rate"],
            batch_number=p["batch"],
            vendor_id=f"VEND-{p['cat'][:3].upper()}",
            is_high_shrink=p["is_shrink"],
            requires_serial_check=p["serial"],
            expected_salvage_rate=p["salvage"]
        )
        db.add(prod)
        created_products.append(prod)
    db.commit()

    # 2. Create Customers
    customers_data = [
        # VIP / Legitimate Customers
        {"ref": "CUST-VIP-01", "name": "Elena Rostova", "email": "elena.rostova@example.com", "orders": 34, "spend": 4820.0, "returns": 2, "wardrobe": 0.05, "flags": 0, "tier": "VIP"},
        {"ref": "CUST-VIP-02", "name": "Marcus Vance", "email": "m.vance@example.com", "orders": 28, "spend": 3950.0, "returns": 1, "wardrobe": 0.02, "flags": 0, "tier": "VIP"},
        {"ref": "CUST-VIP-03", "name": "Sophia Chen", "email": "sophia.chen@example.com", "orders": 22, "spend": 2840.0, "returns": 3, "wardrobe": 0.10, "flags": 0, "tier": "VIP"},
        {"ref": "CUST-LEGIT-04", "name": "David Miller", "email": "david.m@example.com", "orders": 14, "spend": 1250.0, "returns": 1, "wardrobe": 0.08, "flags": 0, "tier": "STANDARD"},
        {"ref": "CUST-LEGIT-05", "name": "Rachel Adams", "email": "rachel.a@example.com", "orders": 9, "spend": 890.0, "returns": 1, "wardrobe": 0.05, "flags": 0, "tier": "STANDARD"},
        
        # Serial Wardrobers
        {"ref": "CUST-WARD-01", "name": "Chloe Deveraux", "email": "chloe.style@example.com", "orders": 16, "spend": 3400.0, "returns": 12, "wardrobe": 0.88, "flags": 4, "tier": "AT_RISK"},
        {"ref": "CUST-WARD-02", "name": "Julian Hayes", "email": "julian.h@example.com", "orders": 12, "spend": 2600.0, "returns": 9, "wardrobe": 0.82, "flags": 3, "tier": "AT_RISK"},
        {"ref": "CUST-WARD-03", "name": "Amber Lockwood", "email": "amber.lockwood@example.com", "orders": 14, "spend": 3100.0, "returns": 11, "wardrobe": 0.91, "flags": 5, "tier": "AT_RISK"},
        
        # Opportunistic Fraudsters / High-Shrink Abusers
        {"ref": "CUST-ABUSE-01", "name": "Victor Sterling", "email": "v_sterling_99@tempmail.com", "orders": 5, "spend": 2400.0, "returns": 4, "wardrobe": 0.45, "flags": 3, "tier": "AT_RISK"},
        {"ref": "CUST-ABUSE-02", "name": "Derrick Holt", "email": "dholt_biz@fastmail.org", "orders": 4, "spend": 1950.0, "returns": 4, "wardrobe": 0.30, "flags": 2, "tier": "AT_RISK"},
        {"ref": "CUST-ABUSE-03", "name": "Trevor Blake", "email": "tblake_retail@inbox.com", "orders": 6, "spend": 3200.0, "returns": 5, "wardrobe": 0.50, "flags": 3, "tier": "AT_RISK"},
        
        # Moderate / Mixed History
        {"ref": "CUST-MIX-01", "name": "Jessica Taylor", "email": "jess.taylor@example.com", "orders": 11, "spend": 1450.0, "returns": 4, "wardrobe": 0.35, "flags": 1, "tier": "STANDARD"},
        {"ref": "CUST-MIX-02", "name": "Brian Gallagher", "email": "brian.g@example.com", "orders": 8, "spend": 980.0, "returns": 3, "wardrobe": 0.28, "flags": 0, "tier": "STANDARD"},
    ]

    created_customers = []
    for c in customers_data:
        cust = Customer(
            customer_ref=c["ref"],
            name=c["name"],
            email=c["email"],
            account_created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(60, 600)),
            total_orders=c["orders"],
            total_spend=c["spend"],
            total_returns=c["returns"],
            return_rate=round(c["returns"] / c["orders"], 3),
            wardrobing_flag_count=c["flags"],
            serial_wardrober_score=c["wardrobe"],
            ltv_tier=c["tier"]
        )
        db.add(cust)
        created_customers.append(cust)
    db.commit()

    # 3. Create Specific Return Scenarios
    # Scenario A: Defective Batch Victim (Legitimate -> EXCHANGE / APPROVE)
    # Scenario B: Serial Wardrober (Potential Abuse -> RESTRICT / INSPECT)
    # Scenario C: Serialized Electronics High Ticket (Uncertain / Potential Abuse -> INSPECT / ESCALATE)
    # Scenario D: VIP Legitimate sizing / changed mind (Legitimate -> APPROVE)
    # Scenario E: Late return with reason discrepancy (Potential Abuse -> RESTRICT)

    scenarios = [
        # 1. Defective Gaming Monitor (Known bad batch 409) -> Elena (VIP)
        {
            "cust_ref": "CUST-VIP-01", "prod_ref": "PROD-105", "reason": "DEFECTIVE",
            "comment": "Screen flickers continuously with green horizontal lines right out of the box. Power cycling did not resolve.",
            "condition": "OPENED_LIKE_NEW", "days": 2, "photos": True
        },
        # 2. Gala Dress Wardrober -> Chloe (Serial Wardrober)
        {
            "cust_ref": "CUST-WARD-01", "prod_ref": "PROD-201", "reason": "DEFECTIVE",
            "comment": "Wore to dinner party Saturday night, zipper feels slightly loose and didn't match the gala theme. Need immediate refund.",
            "condition": "USED", "days": 3, "photos": False
        },
        # 3. 4K Mirrorless Camera ($1199) -> Victor (Abuse Risk)
        {
            "cust_ref": "CUST-ABUSE-01", "prod_ref": "PROD-102", "reason": "NOT_AS_DESCRIBED",
            "comment": "Box arrived open, accessory missing, want instant refund to card.",
            "condition": "OPENED_LIKE_NEW", "days": 4, "photos": False
        },
        # 4. Cashmere Overcoat ($850) -> Julian (Wardrober)
        {
            "cust_ref": "CUST-WARD-02", "prod_ref": "PROD-202", "reason": "CHANGED_MIND",
            "comment": "Used for wedding weekend photoshoot, tags removed but still in pristine shape.",
            "condition": "USED", "days": 5, "photos": False
        },
        # 5. Noise-Cancelling Headphones ($349) -> Marcus (VIP)
        {
            "cust_ref": "CUST-VIP-02", "prod_ref": "PROD-101", "reason": "DOES_NOT_FIT",
            "comment": "Earcups press too hard against my glasses, uncomfortable during long flights.",
            "condition": "UNOPENED", "days": 2, "photos": True
        },
        # 6. Drone 4K ($799) -> Derrick (High-Shrink Fraudster)
        {
            "cust_ref": "CUST-ABUSE-02", "prod_ref": "PROD-104", "reason": "DEFECTIVE",
            "comment": "Gimbal stopped spinning mid flight and fell. Sending back body only without original box.",
            "condition": "DAMAGED", "days": 27, "photos": False
        },
        # 7. Leather Chelsea Boots ($310) -> Sophia (VIP)
        {
            "cust_ref": "CUST-VIP-03", "prod_ref": "PROD-304", "reason": "DOES_NOT_FIT",
            "comment": "Ordered size 9 but fits more like 8.5. Would love an exchange for size 9.5 if available!",
            "condition": "UNOPENED", "days": 1, "photos": True
        },
        # 8. Tuxedo Blazer ($520) -> Amber (Serial Wardrober)
        {
            "cust_ref": "CUST-WARD-03", "prod_ref": "PROD-203", "reason": "CHANGED_MIND",
            "comment": "Event concluded on Sunday, blazer no longer required.",
            "condition": "USED", "days": 4, "photos": False
        },
        # 9. Espresso Machine ($699) -> Jessica (Mixed)
        {
            "cust_ref": "CUST-MIX-01", "prod_ref": "PROD-403", "reason": "DEFECTIVE",
            "comment": "Steam wand pressure gauge stays at zero. Cannot froth milk properly.",
            "condition": "OPENED_LIKE_NEW", "days": 6, "photos": True
        },
        # 10. Cotton Tees ($75) -> David (Legit Standard)
        {
            "cust_ref": "CUST-LEGIT-04", "prod_ref": "PROD-401", "reason": "DOES_NOT_FIT",
            "comment": "Too loose around the neck, still in original plastic packaging.",
            "condition": "UNOPENED", "days": 3, "photos": True
        },
        # 11. Leather Crossbody Bag ($620) -> Trevor (Abuse)
        {
            "cust_ref": "CUST-ABUSE-03", "prod_ref": "PROD-302", "reason": "WRONG_ITEM",
            "comment": "Received empty parcel with paper inside. Need full reimbursement now.",
            "condition": "DAMAGED", "days": 29, "photos": False
        },
        # 12. WiFi 7 Router ($289) -> Brian (Mixed)
        {
            "cust_ref": "CUST-MIX-02", "prod_ref": "PROD-103", "reason": "CHANGED_MIND",
            "comment": "Discovered my ISP provided a complimentary WiFi 7 gateway so this unit is unneeded.",
            "condition": "UNOPENED", "days": 5, "photos": True
        }
    ]

    # Map lookups
    cust_map = {c.customer_ref: c for c in created_customers}
    prod_map = {p.product_ref: p for p in created_products}

    created_return_ids = []
    base_date = datetime.datetime.utcnow() - datetime.timedelta(days=30)

    for i, s in enumerate(scenarios, 1):
        cust = cust_map[s["cust_ref"]]
        prod = prod_map[s["prod_ref"]]
        
        # Order
        ord_date = base_date + datetime.timedelta(days=i * 2)
        order = Order(
            order_ref=f"ORD-2026-{1000 + i}",
            customer_id=cust.id,
            order_date=ord_date,
            total_amount=prod.price,
            payment_method="CREDIT_CARD",
            delivery_date=ord_date + datetime.timedelta(days=2)
        )
        db.add(order)
        db.flush()

        # Return
        req_date = order.delivery_date + datetime.timedelta(days=s["days"])
        return_req = ReturnRequest(
            return_ref=f"RET-2026-{5000 + i}",
            order_id=order.id,
            customer_id=cust.id,
            product_id=prod.id,
            request_date=req_date,
            days_since_delivery=s["days"],
            stated_reason=s["reason"],
            customer_comment=s["comment"],
            claimed_condition=s["condition"],
            photos_provided=s["photos"],
            tracking_number=f"TRK-9876-{i}X",
            status="PENDING"
        )
        db.add(return_req)
        db.flush()
        created_return_ids.append(return_req.id)

    db.commit()
    print(f"Created {len(created_return_ids)} return requests. Executing autonomous agent investigations...")

    # Execute Autonomous Investigations for all returns
    for ret_id in created_return_ids:
        try:
            investigator_agent.investigate(db=db, return_id=ret_id)
        except Exception as e:
            print(f"Error investigating return {ret_id}: {e}")

    print("Initial seed data and investigation complete!")
    db.close()

if __name__ == "__main__":
    seed_database()
