"""Opportunity routes (req #4a hiring / #4b seeking) with domain matching.

Also covers applications & referrals — bridging the board toward an ATS-style
flow where alumni apply to hiring posts or refer a connection (referral bonus).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.opportunity import opportunity_crud
from app.db.session import get_db
from app.models.application import Application
from app.models.connection import Connection
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    ReferralCreate,
)
from app.schemas.opportunity import OpportunityCreate, OpportunityOut
from app.services.matching_service import fan_out_matches
from app.services.notification_service import notify

router = APIRouter()


def _are_connected(db: Session, a: int, b: int) -> bool:
    return db.scalar(
        select(Connection).where(
            Connection.status == "accepted",
            or_(
                (Connection.requester_id == a) & (Connection.addressee_id == b),
                (Connection.requester_id == b) & (Connection.addressee_id == a),
            ),
        )
    ) is not None


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


@router.post("/{opp_id}/apply", response_model=ApplicationOut, status_code=201)
def apply_to_opportunity(
    opp_id: int,
    data: ApplicationCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    opp = opportunity_crud.get(db, opp_id)
    if opp is None or opp.status != "open":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not open")
    if opp.author_id == current.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot apply to your own post")
    existing = db.scalar(
        select(Application).where(
            Application.opportunity_id == opp_id,
            Application.applicant_id == current.id,
        )
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Already applied")
    app_row = Application(
        opportunity_id=opp_id, applicant_id=current.id, note=data.note
    )
    db.add(app_row)
    db.commit()
    db.refresh(app_row)
    notify(
        db, user_id=opp.author_id, type="application",
        message=f"{current.full_name} applied to '{opp.title}'.",
        link="/opportunities",
    )
    return app_row


@router.post("/{opp_id}/refer", response_model=ApplicationOut, status_code=201)
def refer_candidate(
    opp_id: int,
    data: ReferralCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    opp = opportunity_crud.get(db, opp_id)
    if opp is None or opp.status != "open":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not open")
    candidate = db.get(User, data.candidate_id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    if data.candidate_id == current.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Use apply for yourself")
    if not _are_connected(db, current.id, data.candidate_id):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "You can only refer your connections"
        )
    existing = db.scalar(
        select(Application).where(
            Application.opportunity_id == opp_id,
            Application.applicant_id == data.candidate_id,
        )
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Candidate already in pipeline")
    app_row = Application(
        opportunity_id=opp_id,
        applicant_id=data.candidate_id,
        referred_by=current.id,
        note=data.note,
    )
    db.add(app_row)
    db.commit()
    db.refresh(app_row)
    notify(
        db, user_id=opp.author_id, type="application",
        message=f"{current.full_name} referred {candidate.full_name} for '{opp.title}'.",
        link="/opportunities",
    )
    notify(
        db, user_id=data.candidate_id, type="application",
        message=f"{current.full_name} referred you for '{opp.title}'.",
        link="/opportunities",
    )
    return app_row


@router.get("/{opp_id}/applications", response_model=list[ApplicationOut])
def list_applications(
    opp_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Application]:
    opp = opportunity_crud.get(db, opp_id)
    if opp is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not found")
    if opp.author_id != current.id and current.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your opportunity")
    return list(
        db.scalars(
            select(Application)
            .where(Application.opportunity_id == opp_id)
            .order_by(Application.created_at.desc())
        ).all()
    )


@router.get("/applications/mine", response_model=list[ApplicationOut])
def my_applications(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Application]:
    return list(
        db.scalars(
            select(Application)
            .where(Application.applicant_id == current.id)
            .order_by(Application.created_at.desc())
        ).all()
    )


@router.patch("/applications/{application_id}", response_model=ApplicationOut)
def update_application_status(
    application_id: int,
    data: ApplicationStatusUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    app_row = db.get(Application, application_id)
    if app_row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    opp = opportunity_crud.get(db, app_row.opportunity_id)
    if opp is None or (opp.author_id != current.id and current.role != "admin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your opportunity")
    if data.status not in {"applied", "shortlisted", "hired", "rejected"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status")
    app_row.status = data.status
    db.commit()
    db.refresh(app_row)
    notify(
        db, user_id=app_row.applicant_id, type="application",
        message=f"Your application for '{opp.title}' is now {data.status}.",
        link="/opportunities",
    )
    return app_row
