"""Alumni profile schemas — registration capture (req #3)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class AlumniProfileBase(BaseModel):
    program_trained: str | None = None
    batch_year: int | None = None
    current_company: str | None = None
    current_title: str | None = None
    expertise_domain: str | None = None
    skills: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    open_to_mentoring: bool = False
    open_to_opportunities: bool = False
    interested_in_startupvarsity: bool = False
    headline: str | None = None
    bio: str | None = None
    avatar_url: str | None = None


class AlumniProfileUpdate(AlumniProfileBase):
    pass


class AlumniProfileOut(AlumniProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime | None = None
    user: UserPublic | None = None
