"""Events & webinars routes (req #2a): create, browse, RSVP, my events.

Drives recurring community engagement — alumni meetups, mentor AMAs, Rooman
program launches. RSVPs respect optional capacity (overflow goes to waitlist)
and notify the host.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.event import Event, EventRSVP
from app.models.user import User
from app.schemas.event import EventCreate, EventOut
from app.schemas.user import UserPublic
from app.services.notification_service import notify

router = APIRouter()


def _attendee_count(db: Session, event_id: int) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(EventRSVP)
            .where(EventRSVP.event_id == event_id, EventRSVP.status == "going")
        )
        or 0
    )


def _to_out(db: Session, event: Event, me_id: int) -> EventOut:
    count = _attendee_count(db, event.id)
    mine = db.scalar(
        select(EventRSVP).where(
            EventRSVP.event_id == event.id, EventRSVP.user_id == me_id
        )
    )
    spots_left = None if event.capacity is None else max(event.capacity - count, 0)
    host = db.get(User, event.host_id)
    return EventOut(
        id=event.id,
        host_id=event.host_id,
        title=event.title,
        description=event.description,
        kind=event.kind,
        location=event.location,
        meeting_url=event.meeting_url,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        capacity=event.capacity,
        cover_emoji=event.cover_emoji,
        status=event.status,
        created_at=event.created_at,
        host=UserPublic(id=host.id, full_name=host.full_name) if host else None,
        attendee_count=count,
        is_attending=bool(mine and mine.status == "going"),
        spots_left=spots_left,
    )


@router.get("", response_model=list[EventOut])
def list_events(
    upcoming: bool = True,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[EventOut]:
    stmt = select(Event).where(Event.status == "published")
    if upcoming:
        stmt = stmt.where(Event.starts_at >= datetime.now(timezone.utc))
    stmt = stmt.order_by(Event.starts_at.asc())
    events = list(db.scalars(stmt).all())
    return [_to_out(db, e, current.id) for e in events]


@router.post("", response_model=EventOut, status_code=201)
def create_event(
    data: EventCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventOut:
    event = Event(host_id=current.id, **data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    # Host is automatically attending their own event.
    db.add(EventRSVP(event_id=event.id, user_id=current.id, status="going"))
    db.commit()
    return _to_out(db, event, current.id)


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventOut:
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    return _to_out(db, event, current.id)


@router.post("/{event_id}/rsvp", response_model=EventOut)
def rsvp_event(
    event_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventOut:
    event = db.get(Event, event_id)
    if event is None or event.status != "published":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not available")

    existing = db.scalar(
        select(EventRSVP).where(
            EventRSVP.event_id == event_id, EventRSVP.user_id == current.id
        )
    )
    if existing:
        return _to_out(db, event, current.id)

    going = _attendee_count(db, event_id)
    full = event.capacity is not None and going >= event.capacity
    rsvp_status = "waitlist" if full else "going"
    db.add(EventRSVP(event_id=event_id, user_id=current.id, status=rsvp_status))
    db.commit()
    if event.host_id != current.id:
        verb = "joined the waitlist for" if full else "is attending"
        notify(
            db, user_id=event.host_id, type="event",
            message=f"{current.full_name} {verb} '{event.title}'.",
            link="/events",
        )
    return _to_out(db, event, current.id)


@router.delete("/{event_id}/rsvp", response_model=EventOut)
def cancel_rsvp(
    event_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventOut:
    event = db.get(Event, event_id)
    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    rsvp = db.scalar(
        select(EventRSVP).where(
            EventRSVP.event_id == event_id, EventRSVP.user_id == current.id
        )
    )
    if rsvp:
        was_going = rsvp.status == "going"
        db.delete(rsvp)
        db.commit()
        # Promote the earliest waitlisted attendee, if any.
        if was_going and event.capacity is not None:
            nxt = db.scalar(
                select(EventRSVP)
                .where(EventRSVP.event_id == event_id, EventRSVP.status == "waitlist")
                .order_by(EventRSVP.created_at.asc())
            )
            if nxt:
                nxt.status = "going"
                db.commit()
                notify(
                    db, user_id=nxt.user_id, type="event",
                    message=f"A spot opened up — you're now confirmed for '{event.title}'.",
                    link="/events",
                )
    return _to_out(db, event, current.id)


@router.get("/mine/list", response_model=list[EventOut])
def my_events(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[EventOut]:
    rows = list(
        db.scalars(
            select(Event)
            .join(EventRSVP, EventRSVP.event_id == Event.id)
            .where(EventRSVP.user_id == current.id)
            .order_by(Event.starts_at.asc())
        ).all()
    )
    return [_to_out(db, e, current.id) for e in rows]
