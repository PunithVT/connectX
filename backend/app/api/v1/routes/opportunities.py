"""Opportunity routes (req #4a hiring / #4b seeking) with domain matching."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.opportunity import opportunity_crud
from app.db.session import get_db
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.opportunity import OpportunityCreate, OpportunityOut
from app.services.matching_service import fan_out_matches

router = APIRouter()


@router.get("", response_model=list[OpportunityOut])
def list_opportunities(
    kind: str | None = None,
    domain: str | None = None,
    limit: int = 20,
    offset: int = 0,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Opportunity]:
    return opportunity_crud.search(
        db, kind=kind, domain=domain, limit=limit, offset=offset
    )


@router.post("", response_model=OpportunityOut, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    data: OpportunityCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Opportunity:
    opp = Opportunity(author_id=current.id, **data.model_dump())
    opportunity_crud.create(db, opp)
    # notify counterpart authors in the same domain
    fan_out_matches(db, opp)
    return opportunity_crud.get(db, opp.id)


@router.post("/{opp_id}/close", response_model=OpportunityOut)
def close_opportunity(
    opp_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Opportunity:
    opp = opportunity_crud.get(db, opp_id)
    if opp is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not found")
    if opp.author_id != current.id and current.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your opportunity")
    opp.status = "closed"
    db.commit()
    return opp
