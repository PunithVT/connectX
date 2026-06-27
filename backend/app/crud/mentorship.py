"""Mentorship CRUD."""
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.crud.base import CRUDBase
from app.models.mentorship import MentorProfile, MentorshipSession


class CRUDMentor(CRUDBase[MentorProfile]):
    def get_by_user(self, db: Session, user_id: int) -> MentorProfile | None:
        return db.scalar(
            select(MentorProfile).where(MentorProfile.user_id == user_id)
        )

    def list_active(
        self, db: Session, *, limit: int = 20, offset: int = 0
    ) -> list[MentorProfile]:
        stmt = (
            select(MentorProfile)
            .options(selectinload(MentorProfile.user))
            .where(MentorProfile.is_active.is_(True))
            .order_by(MentorProfile.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(db.scalars(stmt).all())


class CRUDSession(CRUDBase[MentorshipSession]):
    def list_for_user(self, db: Session, user_id: int) -> list[MentorshipSession]:
        stmt = (
            select(MentorshipSession)
            .where(MentorshipSession.mentee_id == user_id)
            .order_by(MentorshipSession.scheduled_at.desc())
        )
        return list(db.scalars(stmt).all())


mentor_crud = CRUDMentor(MentorProfile)
session_crud = CRUDSession(MentorshipSession)
