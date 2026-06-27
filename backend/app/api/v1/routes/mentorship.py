"""Mentorship routes (req #2b): become a mentor, browse, book paid sessions."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.mentorship import mentor_crud, session_crud
from app.db.session import get_db
from app.models.mentorship import MentorProfile, MentorshipSession
from app.models.user import User
from app.schemas.mentorship import (
    MentorProfileCreate,
    MentorProfileOut,
    SessionCreate,
    SessionOut,
)
from app.services import payment_service
from app.services.notification_service import notify

router = APIRouter()


@router.get("/mentors", response_model=list[MentorProfileOut])
def list_mentors(
    limit: int = 20,
    offset: int = 0,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MentorProfile]:
    return mentor_crud.list_active(db, limit=limit, offset=offset)


@router.post("/mentors", response_model=MentorProfileOut, status_code=201)
def become_mentor(
    data: MentorProfileCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MentorProfile:
    existing = mentor_crud.get_by_user(db, current.id)
    if existing:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing
    profile = MentorProfile(user_id=current.id, **data.model_dump())
    mentor_crud.create(db, profile)
    if current.profile:
        current.profile.open_to_mentoring = True
        db.commit()
    return profile


@router.get("/sessions", response_model=list[SessionOut])
def my_sessions(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MentorshipSession]:
    return session_crud.list_for_user(db, current.id)


@router.post("/sessions", response_model=SessionOut, status_code=201)
def book_session(
    data: SessionCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MentorshipSession:
    mentor = mentor_crud.get(db, data.mentor_id)
    if mentor is None or not mentor.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mentor not available")
    if mentor.user_id == current.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot mentor yourself")

    amount = payment_service.compute_session_amount(mentor, data.duration_minutes)
    session = MentorshipSession(
        mentor_id=mentor.id,
        mentee_id=current.id,
        program=data.program,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        amount=amount,
        status="requested",
        payment_status="pending",
    )
    session_crud.create(db, session)
    payment_service.create_payment_intent(amount, session.id)
    notify(
        db,
        user_id=mentor.user_id,
        type="mentorship",
        message=f"{current.full_name} requested a mentorship session (₹{amount}).",
        link="/mentorship",
    )
    return session
