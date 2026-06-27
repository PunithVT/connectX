"""Job application & referral schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class ApplicationCreate(BaseModel):
    note: str | None = None


class ReferralCreate(BaseModel):
    candidate_id: int
    note: str | None = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    opportunity_id: int
    applicant_id: int
    referred_by: int | None = None
    note: str | None = None
    status: str
    created_at: datetime | None = None
    applicant: UserPublic | None = None
    referrer: UserPublic | None = None


class ApplicationStatusUpdate(BaseModel):
    status: str  # applied | shortlisted | hired | rejected
