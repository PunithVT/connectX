"""Notification routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut

router = APIRouter()


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.user_id == current.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
    )
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    return list(db.scalars(stmt.limit(50)).all())


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Notification:
    n = db.get(Notification, notification_id)
    if n is None or n.user_id != current.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    n.is_read = True
    db.commit()
    db.refresh(n)
    return n


@router.post("/read-all")
def mark_all_read(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    db.execute(
        update(Notification)
        .where(Notification.user_id == current.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return {"status": "ok"}
