"""User schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    is_active: bool
    created_at: datetime | None = None


class UserPublic(BaseModel):
    """Lightweight user reference embedded in posts / comments."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
