"""Mentorship schemas (req #2b)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class MentorProfileCreate(BaseModel):
    programs: str | None = None
    headline: str | None = None
    bio: str | None = None
    hourly_rate: float = 0.0


class MentorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    programs: str | None = None
    headline: str | None = None
    bio: str | None = None
    hourly_rate: float
    is_active: bool
    user: UserPublic | None = None


class SessionCreate(BaseModel):
    mentor_id: int
    program: str | None = None
    scheduled_at: datetime
    duration_minutes: int = 60


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mentor_id: int
    mentee_id: int
    program: str | None = None
    scheduled_at: datetime
    duration_minutes: int
    amount: float
    status: str
    payment_status: str
    created_at: datetime | None = None
    reviewed: bool = False
