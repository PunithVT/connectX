"""Connection schemas (engagement)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class ConnectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    requester_id: int
    addressee_id: int
    status: str
    created_at: datetime | None = None


class ConnectionUser(BaseModel):
    """A connection presented from the current user's point of view."""

    connection_id: int
    status: str
    user: UserPublic
    headline: str | None = None
    expertise_domain: str | None = None
    current_company: str | None = None


class ConnectionStatus(BaseModel):
    """Relationship of the current user to another user."""

    # none | pending_outgoing | pending_incoming | connected | self
    state: str
    connection_id: int | None = None
