"""Group (community) post schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class GroupPostCreate(BaseModel):
    body: str


class GroupPostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    community_id: int
    author_id: int
    body: str
    created_at: datetime | None = None
    author: UserPublic | None = None
