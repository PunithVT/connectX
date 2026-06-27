"""connectX API — FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # In development, create tables on startup so the app runs with no manual
    # migration step. In production, prefer Alembic (`alembic upgrade head`).
    if settings.ENV == "development" and settings.AUTO_CREATE_TABLES:
        from app.db.base import Base
        from app.db import base_all  # noqa: F401 — populates Base.metadata
        from app.db.session import engine

        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="connectX — Rooman Alumni Network",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
