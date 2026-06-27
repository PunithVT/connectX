"""Connection routes (engagement): request / accept / decline / list / status.

Lets alumni connect with each other so they can then message and discuss.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.alumni_profile import AlumniProfile
from app.models.connection import Connection
from app.models.user import User
from app.schemas.connection import ConnectionStatus, ConnectionUser
from app.schemas.user import UserPublic
from app.services.notification_service import notify

router = APIRouter()


def _pair(db: Session, a: int, b: int) -> Connection | None:
    return db.scalar(
        select(Connection).where(
            or_(
                (Connection.requester_id == a) & (Connection.addressee_id == b),
                (Connection.requester_id == b) & (Connection.addressee_id == a),
            )
        )
    )


def _as_connection_user(db: Session, conn: Connection, me_id: int) -> ConnectionUser:
    other_id = conn.addressee_id if conn.requester_id == me_id else conn.requester_id
    other = db.get(User, other_id)
    profile = db.scalar(
        select(AlumniProfile).where(AlumniProfile.user_id == other_id)
    )
    return ConnectionUser(
        connection_id=conn.id,
        status=conn.status,
        user=UserPublic(id=other.id, full_name=other.full_name),
        headline=profile.headline if profile else None,
        expertise_domain=profile.expertise_domain if profile else None,
        current_company=profile.current_company if profile else None,
    )


@router.get("/status/{user_id}", response_model=ConnectionStatus)
def connection_status(
    user_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConnectionStatus:
    if user_id == current.id:
        return ConnectionStatus(state="self")
    conn = _pair(db, current.id, user_id)
    if conn is None:
        return ConnectionStatus(state="none")
    if conn.status == "accepted":
        return ConnectionStatus(state="connected", connection_id=conn.id)
    if conn.requester_id == current.id:
        return ConnectionStatus(state="pending_outgoing", connection_id=conn.id)
    return ConnectionStatus(state="pending_incoming", connection_id=conn.id)


@router.post("/{user_id}", response_model=ConnectionStatus, status_code=201)
def request_connection(
    user_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConnectionStatus:
    if user_id == current.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot connect with yourself")
    if db.get(User, user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    existing = _pair(db, current.id, user_id)
    if existing:
        # If they already requested me, this acts as an accept.
        if existing.status == "pending" and existing.addressee_id == current.id:
            existing.status = "accepted"
            existing.responded_at = datetime.now(timezone.utc)
            db.commit()
            notify(
                db, user_id=existing.requester_id, type="connection",
                message=f"{current.full_name} accepted your connection request.",
                link="/network",
            )
            return ConnectionStatus(state="connected", connection_id=existing.id)
        if existing.status == "accepted":
            return ConnectionStatus(state="connected", connection_id=existing.id)
        return ConnectionStatus(state="pending_outgoing", connection_id=existing.id)

    conn = Connection(requester_id=current.id, addressee_id=user_id, status="pending")
    db.add(conn)
    db.commit()
    db.refresh(conn)
    notify(
        db, user_id=user_id, type="connection",
        message=f"{current.full_name} wants to connect with you.",
        link="/network",
    )
    return ConnectionStatus(state="pending_outgoing", connection_id=conn.id)


@router.post("/{connection_id}/accept", response_model=ConnectionStatus)
def accept_connection(
    connection_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConnectionStatus:
    conn = db.get(Connection, connection_id)
    if conn is None or conn.addressee_id != current.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    if conn.status != "pending":
        return ConnectionStatus(state="connected", connection_id=conn.id)
    conn.status = "accepted"
    conn.responded_at = datetime.now(timezone.utc)
    db.commit()
    notify(
        db, user_id=conn.requester_id, type="connection",
        message=f"{current.full_name} accepted your connection request.",
        link="/network",
    )
    return ConnectionStatus(state="connected", connection_id=conn.id)


@router.post("/{connection_id}/decline")
def decline_connection(
    connection_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    conn = db.get(Connection, connection_id)
    if conn is None or current.id not in (conn.addressee_id, conn.requester_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    db.delete(conn)
    db.commit()
    return {"status": "ok"}


@router.get("", response_model=list[ConnectionUser])
def list_connections(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ConnectionUser]:
    conns = list(
        db.scalars(
            select(Connection).where(
                Connection.status == "accepted",
                or_(
                    Connection.requester_id == current.id,
                    Connection.addressee_id == current.id,
                ),
            )
        ).all()
    )
    return [_as_connection_user(db, c, current.id) for c in conns]


@router.get("/pending", response_model=list[ConnectionUser])
def pending_requests(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ConnectionUser]:
    conns = list(
        db.scalars(
            select(Connection).where(
                Connection.status == "pending",
                Connection.addressee_id == current.id,
            )
        ).all()
    )
    return [_as_connection_user(db, c, current.id) for c in conns]
