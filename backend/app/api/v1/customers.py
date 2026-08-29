from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db
from app.db.models import Customer
from app.schemas.entities import CustomerDetailSchema

router = APIRouter()

@router.get("", response_model=List[CustomerDetailSchema])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@router.get("/{customer_id}", response_model=CustomerDetailSchema)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    cust = db.query(Customer).filter(Customer.id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust
