"""StartupVarsity project schemas (req #2c)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserPublic


class StartupProjectCreate(BaseModel):
    name: str
    pitch: str | None = None
    stage: str = "idea"
    resources_requested: str | None = None


class StartupProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    pitch: str | None = None
    stage: str
    resources_requested: str | None = None
    status: str
    created_at: datetime | None = None
    owner: UserPublic | None = None
