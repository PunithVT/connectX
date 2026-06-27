"""Pytest fixtures — isolated in-memory SQLite app + client."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings

# Never touch the real (RDS) database during tests.
settings.AUTO_CREATE_TABLES = False

from app.db.base import Base  # noqa: E402
from app.db import base_all  # noqa: F401
from app.db.session import get_db
from app.main import app


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_token(client, db_session):
    from app.crud.user import user_crud

    user_crud.create_user(
        db_session, email="admin@test.com", password="pw12345",
        full_name="Admin", role="admin",
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "pw12345"},
    )
    return res.json()["access_token"]
