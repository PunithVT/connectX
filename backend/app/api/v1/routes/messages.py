"""Direct message routes (engagement): inbox, thread, send.

Messaging requires an accepted connection — alumni connect first, then discuss.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_, select, update
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.models.connection import Connection
from app.models.message import Message
from app.models.user import User
from app.db.session import get_db
from app.schemas.message import ConversationOut, MessageCreate, MessageOut
from app.schemas.user import UserPublic
from app.services.notification_service import notify

router = APIRouter()


def _are_connected(db: Session, a: int, b: int) -> bool:
    return db.scalar(
        select(Connection).where(
            Connection.status == "accepted",
            or_(
                and_(Connection.requester_id == a, Connection.addressee_id == b),
                and_(Connection.requester_id == b, Connection.addressee_id == a),
            ),
        )
    ) is not None


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ConversationOut]:
    msgs = list(
        db.scalars(
            select(Message)
            .where(or_(Message.sender_id == current.id, Message.recipient_id == current.id))
            .order_by(Message.created_at.desc(), Message.id.desc())
        ).all()
    )
    seen: dict[int, ConversationOut] = {}
    unread: dict[int, int] = {}
    for m in msgs:
        peer_id = m.recipient_id if m.sender_id == current.id else m.sender_id
        if not m.is_read and m.recipient_id == current.id:
            unread[peer_id] = unread.get(peer_id, 0) + 1
        if peer_id not in seen:
            peer = db.get(User, peer_id)
            if peer is None:
                continue
            seen[peer_id] = ConversationOut(
                peer=UserPublic(id=peer.id, full_name=peer.full_name),
                last_message=m.body,
                last_at=m.created_at,
                unread=0,
            )
    for peer_id, convo in seen.items():
        convo.unread = unread.get(peer_id, 0)
    return list(seen.values())


@router.get("/{user_id}", response_model=list[MessageOut])
def get_thread(
    user_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Message]:
    thread = list(
        db.scalars(
            select(Message)
            .where(
                or_(
                    and_(Message.sender_id == current.id, Message.recipient_id == user_id),
                    and_(Message.sender_id == user_id, Message.recipient_id == current.id),
                )
            )
            .order_by(Message.created_at.asc(), Message.id.asc())
        ).all()
    )
    # mark incoming as read
    db.execute(
        update(Message)
        .where(
            Message.sender_id == user_id,
            Message.recipient_id == current.id,
            Message.is_read.is_(False),
        )
        .values(is_read=True)
    )
    db.commit()
    return thread


@router.post("/{user_id}", response_model=MessageOut, status_code=201)
def send_message(
    user_id: int,
    data: MessageCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Message:
    if user_id == current.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot message yourself")
    if db.get(User, user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if not _are_connected(db, current.id, user_id):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Connect with this person before messaging"
        )
    if not data.body.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Message cannot be empty")

    msg = Message(sender_id=current.id, recipient_id=user_id, body=data.body.strip())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    notify(
        db, user_id=user_id, type="message",
        message=f"New message from {current.full_name}.",
        link=f"/messages/{current.id}",
    )
    return msg
