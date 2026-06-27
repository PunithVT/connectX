"""Spotlight (success story) schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class SpotlightCreate(BaseModel):
    title: str
    story: str
    program_trained: str | None = None
    cover_emoji: str = "🌟"


class SpotlightOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    story: str
    program_trained: str | None = None
    cover_emoji: str | None = None
    is_featured: bool
    likes: int
    created_at: datetime | None = None
    user: UserPublic | None = None
