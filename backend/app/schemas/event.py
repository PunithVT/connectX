"""Event & RSVP schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class EventCreate(BaseModel):
    title: str
    description: str | None = None
    kind: str = "webinar"  # webinar | meetup | ama | launch | workshop
    location: str | None = None
    meeting_url: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    capacity: int | None = None
    cover_emoji: str = "🎉"


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    host_id: int
    title: str
    description: str | None = None
    kind: str
    location: str | None = None
    meeting_url: str | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    capacity: int | None = None
    cover_emoji: str | None = None
    status: str
    created_at: datetime | None = None
    host: UserPublic | None = None
    # computed
    attendee_count: int = 0
    is_attending: bool = False
    spots_left: int | None = None
