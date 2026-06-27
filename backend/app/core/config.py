"""Application settings, loaded from environment / .env."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "connectX"
    ENV: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://connectx:connectx@localhost:5432/connectx"

    # Auth
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # Invites / email
    INVITE_TOKEN_EXPIRE_HOURS: int = 168  # 7 days
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    EMAIL_FROM: str = "alumni@rooman.com"
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # Async
    REDIS_URL: str = "redis://localhost:6379/0"

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
