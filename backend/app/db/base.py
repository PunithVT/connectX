"""SQLAlchemy declarative base shared by every ORM model."""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Project-wide declarative base."""
    pass
