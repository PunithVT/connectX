"""Endorsement schemas."""
from pydantic import BaseModel

from app.schemas.user import UserPublic


class EndorseRequest(BaseModel):
    skill: str


class SkillEndorsement(BaseModel):
    """Aggregated endorsements for one skill on a user's profile."""

    skill: str
    count: int
    endorsed_by_me: bool = False
    endorsers: list[UserPublic] = []
