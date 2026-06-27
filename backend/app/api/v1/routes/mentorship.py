"""Mentorship routes (req #2b): become a mentor, browse, book paid sessions.

Also covers post-session reviews and the mentor leaderboard (ratings-driven).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.mentorship import mentor_crud, session_crud
from app.db.session import get_db
from app.models.mentor_review import MentorReview
from app.models.mentorship import MentorProfile, MentorshipSession
from app.models.user import User
from app.schemas.mentor_review import (
    MentorLeaderboardEntry,
    ReviewCreate,
    ReviewOut,
)
from app.schemas.mentorship import (
    MentorProfileCreate,
    MentorProfileOut,
    SessionCreate,
    SessionOut,
)
from app.schemas.user import UserPublic
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
) -> list[SessionOut]:
    sessions = session_crud.list_for_user(db, current.id)
    reviewed_ids = set(
        db.scalars(
            select(MentorReview.session_id).where(
                MentorReview.session_id.in_([s.id for s in sessions] or [0])
            )
        ).all()
    )
    return [
        SessionOut.model_validate(s).model_copy(update={"reviewed": s.id in reviewed_ids})
        for s in sessions
    ]


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


@router.post("/sessions/{session_id}/complete", response_model=SessionOut)
def complete_session(
    session_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MentorshipSession:
    session = db.get(MentorshipSession, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    mentor = db.get(MentorProfile, session.mentor_id)
    # Either party may mark the session complete.
    if current.id not in (session.mentee_id, mentor.user_id if mentor else None):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your session")
    session.status = "completed"
    db.commit()
    db.refresh(session)
    return session


@router.post("/reviews", response_model=ReviewOut, status_code=201)
def review_session(
    data: ReviewCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MentorReview:
    session = db.get(MentorshipSession, data.session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    if session.mentee_id != current.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the mentee can review")
    existing = db.scalar(
        select(MentorReview).where(MentorReview.session_id == data.session_id)
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Session already reviewed")

    review = MentorReview(
        session_id=session.id,
        mentor_id=session.mentor_id,
        reviewer_id=current.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    mentor = db.get(MentorProfile, session.mentor_id)
    if mentor:
        notify(
            db, user_id=mentor.user_id, type="mentorship",
            message=f"{current.full_name} rated your session {data.rating}★.",
            link="/mentorship",
        )
    return review


@router.get("/mentors/{mentor_id}/reviews", response_model=list[ReviewOut])
def mentor_reviews(
    mentor_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MentorReview]:
    return list(
        db.scalars(
            select(MentorReview)
            .where(MentorReview.mentor_id == mentor_id)
            .order_by(MentorReview.created_at.desc())
        ).all()
    )


@router.get("/leaderboard", response_model=list[MentorLeaderboardEntry])
def leaderboard(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MentorLeaderboardEntry]:
    mentors = list(db.scalars(select(MentorProfile).where(MentorProfile.is_active)).all())
    entries: list[MentorLeaderboardEntry] = []
    for m in mentors:
        completed = (
            db.scalar(
                select(func.count())
                .select_from(MentorshipSession)
                .where(
                    MentorshipSession.mentor_id == m.id,
                    MentorshipSession.status == "completed",
                )
            )
            or 0
        )
        review_count = (
            db.scalar(
                select(func.count())
                .select_from(MentorReview)
                .where(MentorReview.mentor_id == m.id)
            )
            or 0
        )
        avg_rating = (
            db.scalar(
                select(func.avg(MentorReview.rating)).where(
                    MentorReview.mentor_id == m.id
                )
            )
            or 0.0
        )
        u = db.get(User, m.user_id)
        entries.append(
            MentorLeaderboardEntry(
                mentor_id=m.id,
                user=UserPublic(id=u.id, full_name=u.full_name),
                headline=m.headline,
                hourly_rate=m.hourly_rate,
                sessions_completed=completed,
                review_count=review_count,
                avg_rating=round(float(avg_rating), 2),
            )
        )
    entries.sort(key=lambda e: (e.avg_rating, e.review_count, e.sessions_completed), reverse=True)
    return entries
