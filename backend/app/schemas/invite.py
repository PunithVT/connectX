"""Invite schemas (req #1)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class InviteCreate(BaseModel):
    email: EmailStr
    full_name: str | None = None
    program_trained: str | None = None
    batch_year: int | None = None


class InviteBulkCreate(BaseModel):
    invites: list[InviteCreate]


class InviteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None = None
    program_trained: str | None = None
    batch_year: int | None = None
    status: str
    created_at: datetime | None = None
    expires_at: datetime | None = None


class InvitePreview(BaseModel):
    """Public view shown on the accept page (no token leak)."""

    email: EmailStr
    full_name: str | None = None
    program_trained: str | None = None
    status: str


class InviteAccept(BaseModel):
    """Submitted from the accept page → creates User + AlumniProfile."""

    token: str
    password: str
    full_name: str
    current_company: str | None = None
    current_title: str | None = None
    expertise_domain: str | None = None
    skills: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    open_to_mentoring: bool = False
    open_to_opportunities: bool = False
    interested_in_startupvarsity: bool = False
