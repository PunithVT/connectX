"""Feed post + comment schemas (req #4)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class CommentCreate(BaseModel):
    body: str


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    body: str
    created_at: datetime | None = None
    author: UserPublic | None = None


class PostCreate(BaseModel):
    body: str
    post_type: str = "update"  # update | doing | looking


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    body: str
    post_type: str
    likes: int
    created_at: datetime | None = None
    author: UserPublic | None = None
    comments: list[CommentOut] = []
