from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db
from app.db.models import Product
from app.schemas.entities import ProductDetailSchema

router = APIRouter()

@router.get("", response_model=List[ProductDetailSchema])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@router.get("/{product_id}", response_model=ProductDetailSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod
