from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.agent.investigator import investigator_agent
from app.schemas.investigation import InvestigationResponse, RerunDecisionRequest

router = APIRouter()

@router.post("/{return_id}", response_model=InvestigationResponse)
def trigger_investigation(return_id: int, db: Session = Depends(get_db)):
    """
    Trigger initial autonomous investigation on a return request.
    """
    try:
        result = investigator_agent.investigate(db=db, return_id=return_id, actor="AUTONOMOUS_AGENT")
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investigation failed: {str(e)}")

@router.post("/{return_id}/rerun", response_model=InvestigationResponse)
def rerun_decision(
    return_id: int,
    req: RerunDecisionRequest,
    db: Session = Depends(get_db)
):
    """
    Rerun and re-evaluate the return decision following customer/product history changes or merchant parameter overrides.
    """
    overrides = req.model_dump(exclude_none=True)
    try:
        result = investigator_agent.investigate(
            db=db,
            return_id=return_id,
            overrides=overrides,
            actor="MERCHANT_OPERATOR"
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rerun decision failed: {str(e)}")
