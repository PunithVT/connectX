"""Notification + community schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    message: str
    link: str | None = None
    is_read: bool
    created_at: datetime | None = None


class CommunityCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None


class CommunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None = None
    member_count: int = 0
