"""Invite CRUD."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.invite import Invite


class CRUDInvite(CRUDBase[Invite]):
    def get_by_token(self, db: Session, token: str) -> Invite | None:
        return db.scalar(select(Invite).where(Invite.token == token))

    def get_by_email(self, db: Session, email: str) -> Invite | None:
        return db.scalar(select(Invite).where(Invite.email == email))

    def list_by_status(
        self, db: Session, status: str | None = None, *, limit: int = 50, offset: int = 0
    ) -> list[Invite]:
        stmt = select(Invite).order_by(Invite.id.desc())
        if status:
            stmt = stmt.where(Invite.status == status)
        return list(db.scalars(stmt.limit(limit).offset(offset)).all())


invite_crud = CRUDInvite(Invite)
