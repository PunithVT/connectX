"""Mentor review & leaderboard schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserPublic


class ReviewCreate(BaseModel):
    session_id: int
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mentor_id: int
    reviewer_id: int
    rating: int
    comment: str | None = None
    created_at: datetime | None = None
    reviewer: UserPublic | None = None


class MentorLeaderboardEntry(BaseModel):
    mentor_id: int
    user: UserPublic
    headline: str | None = None
    hourly_rate: float
    sessions_completed: int
    review_count: int
    avg_rating: float
