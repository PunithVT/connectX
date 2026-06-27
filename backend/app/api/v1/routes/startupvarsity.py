"""StartupVarsity routes (req #2c): apply for and browse resource projects."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.startup_project import startup_project_crud
from app.db.session import get_db
from app.models.startup_project import StartupProject
from app.models.user import User
from app.schemas.startup_project import StartupProjectCreate, StartupProjectOut

router = APIRouter()


@router.get("", response_model=list[StartupProjectOut])
def list_projects(
    limit: int = 20,
    offset: int = 0,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StartupProject]:
    return startup_project_crud.list_all(db, limit=limit, offset=offset)


@router.post("", response_model=StartupProjectOut, status_code=status.HTTP_201_CREATED)
def apply_for_resources(
    data: StartupProjectCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StartupProject:
    project = StartupProject(owner_id=current.id, **data.model_dump())
    startup_project_crud.create(db, project)
    if current.profile:
        current.profile.interested_in_startupvarsity = True
        db.commit()
    return startup_project_crud.get(db, project.id)
