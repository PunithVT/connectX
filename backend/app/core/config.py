"""Application settings, loaded from environment / .env."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "connectX"
    ENV: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://connectx:connectx@localhost:5432/connectx"
    # Auto-create tables on startup in dev (skip if you use Alembic exclusively)
    AUTO_CREATE_TABLES: bool = True

    # Auth
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # Invites / email
    INVITE_TOKEN_EXPIRE_HOURS: int = 168  # 7 days
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_STARTTLS: bool = False
    EMAIL_FROM: str = "alumni@rooman.com"
    FRONTEND_BASE_URL: str = "http://localhost:5173"

    # Async
    REDIS_URL: str = "redis://localhost:6379/0"

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Sign in with BOS (OpenID Connect against the BOS identity provider).
    # Off unless BOS_SSO_ENABLED is true AND the four BOS_OIDC_* values are set.
    # Email + password sign-in keeps working either way.
    BOS_SSO_ENABLED: bool = False
    BOS_OIDC_ISSUER: str = ""
    BOS_OIDC_CLIENT_ID: str = ""
    BOS_OIDC_CLIENT_SECRET: str = ""
    # Must point at this API's callback, e.g.
    # http://localhost:8000/api/v1/auth/bos/callback
    BOS_OIDC_REDIRECT_URI: str = ""
    # The BOS tenant (organization id) this connectX deployment belongs to.
    # Only people from this tenant get an account created on first sign-in;
    # empty means nobody is auto-created (existing accounts can still sign in).
    BOS_TENANT_ID: str = ""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
