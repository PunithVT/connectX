"""Tiny generic CRUD base to cut boilerplate."""
from typing import Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class CRUDBase(Generic[ModelT]):
    def __init__(self, model: type[ModelT]):
        self.model = model

    def get(self, db: Session, id: int) -> ModelT | None:
        return db.get(self.model, id)

    def list(self, db: Session, *, limit: int = 20, offset: int = 0) -> list[ModelT]:
        stmt = (
            select(self.model)
            .order_by(self.model.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(db.scalars(stmt).all())

    def count(self, db: Session) -> int:
        return db.scalar(select(func.count()).select_from(self.model)) or 0

    def create(self, db: Session, obj: ModelT) -> ModelT:
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def delete(self, db: Session, obj: ModelT) -> None:
        db.delete(obj)
        db.commit()
