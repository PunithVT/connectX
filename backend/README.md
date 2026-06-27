# connectX backend (FastAPI)

REST API for the Rooman Alumni Network.

## Run locally

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit DATABASE_URL etc.

# Option A — let the app create tables on startup (dev default)
uvicorn app.main:app --reload

# Option B — use migrations
alembic revision --autogenerate -m "init"
alembic upgrade head
uvicorn app.main:app --reload

# Seed demo data (admin + alumni + posts + opportunities)
python -m app.db.seed
```

API docs: http://localhost:8000/docs

## Demo logins (after seeding)

| Role   | Email             | Password   |
|--------|-------------------|------------|
| Admin  | admin@rooman.com  | admin123   |
| Alumni | asha@example.com  | alumni123  |

## Layout

- `app/api/v1/routes/` — HTTP handlers per domain
- `app/schemas/` — Pydantic request/response models
- `app/crud/` — DB access helpers
- `app/services/` — business logic (invites, email, matching, payments)
- `app/models/` — SQLAlchemy tables
- `app/workers/` — Celery tasks (async invite fan-out)

## Tests

```bash
pytest
```

Tests run against an isolated in-memory SQLite database (no Postgres needed).
