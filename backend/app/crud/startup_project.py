"""StartupProject CRUD."""
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.crud.base import CRUDBase
from app.models.startup_project import StartupProject


class CRUDStartupProject(CRUDBase[StartupProject]):
    def list_all(
        self, db: Session, *, limit: int = 20, offset: int = 0
    ) -> list[StartupProject]:
        stmt = (
            select(StartupProject)
            .options(selectinload(StartupProject.owner))
            .order_by(StartupProject.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(db.scalars(stmt).all())


startup_project_crud = CRUDStartupProject(StartupProject)
