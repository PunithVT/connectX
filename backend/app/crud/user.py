"""User CRUD."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.crud.base import CRUDBase
from app.models.user import User


class CRUDUser(CRUDBase[User]):
    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.scalar(select(User).where(User.email == email))

    def create_user(
        self, db: Session, *, email: str, password: str, full_name: str,
        role: str = "alumnus",
    ) -> User:
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            role=role,
        )
        return self.create(db, user)


user_crud = CRUDUser(User)
