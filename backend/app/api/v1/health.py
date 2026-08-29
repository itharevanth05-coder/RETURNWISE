from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.deps import get_db
from app.db.session import engine
from app.db.models import Customer, Product, Order, ReturnRequest, Decision, AuditLog

router = APIRouter()

@router.get("", summary="Database & System Health Check")
def health_check(db: Session = Depends(get_db)):
    """
    Performs a database connectivity check and returns table statistics.
    Supports both SQLite and PostgreSQL.
    """
    try:
        # Perform safe ping query
        db.execute(text("SELECT 1"))
        
        dialect_name = engine.dialect.name
        
        counts = {
            "customers": db.query(Customer).count(),
            "products": db.query(Product).count(),
            "orders": db.query(Order).count(),
            "return_requests": db.query(ReturnRequest).count(),
            "decisions": db.query(Decision).count(),
            "audit_logs": db.query(AuditLog).count()
        }
        
        return {
            "status": "healthy",
            "database": {
                "type": dialect_name,
                "connected": True,
                "tables": counts
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": {
                    "type": engine.dialect.name if hasattr(engine, "dialect") else "unknown",
                    "connected": False,
                    "error": str(e)
                }
            }
        )
