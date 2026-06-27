"""Opportunity CRUD."""
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.crud.base import CRUDBase
from app.models.opportunity import Opportunity


class CRUDOpportunity(CRUDBase[Opportunity]):
    def search(
        self,
        db: Session,
        *,
        kind: str | None = None,
        domain: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[Opportunity]:
        stmt = (
            select(Opportunity)
            .options(selectinload(Opportunity.author))
            .where(Opportunity.status == "open")
            .order_by(Opportunity.created_at.desc(), Opportunity.id.desc())
        )
        if kind:
            stmt = stmt.where(Opportunity.kind == kind)
        if domain:
            stmt = stmt.where(Opportunity.expertise_domain.ilike(f"%{domain}%"))
        return list(db.scalars(stmt.limit(limit).offset(offset)).all())


opportunity_crud = CRUDOpportunity(Opportunity)
