"""Direct message schemas (engagement)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class MessageCreate(BaseModel):
    body: str


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    recipient_id: int
    body: str
    is_read: bool
    created_at: datetime | None = None


class ConversationOut(BaseModel):
    """One row per peer in the inbox: the other user + last message + unread."""

    peer: UserPublic
    last_message: str
    last_at: datetime | None = None
    unread: int
