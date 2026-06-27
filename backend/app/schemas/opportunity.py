"""Opportunity schemas (req #4a / #4b)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.user import UserPublic


class OpportunityCreate(BaseModel):
    kind: str  # hiring | seeking
    title: str
    description: str | None = None
    expertise_domain: str | None = None
    location: str | None = None
    company: str | None = None

    @field_validator("kind")
    @classmethod
    def _kind(cls, v: str) -> str:
        if v not in {"hiring", "seeking"}:
            raise ValueError("kind must be 'hiring' or 'seeking'")
        return v


class OpportunityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    title: str
    description: str | None = None
    expertise_domain: str | None = None
    location: str | None = None
    company: str | None = None
    status: str
    created_at: datetime | None = None
    author: UserPublic | None = None
