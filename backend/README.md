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

## Sign in with BOS (optional)

connectX can accept sign-ins from the BOS identity provider (OpenID Connect,
authorization-code flow with PKCE). It is **off by default**; email + password
sign-in is unchanged either way.

1. In `backend/.env` set `BOS_SSO_ENABLED=true` and the four `BOS_OIDC_*` values
   (see `.env.example`). The client secret for the `connectx` client comes from the
   BOS team; never commit it. `BOS_OIDC_REDIRECT_URI` must be this API's
   `/api/v1/auth/bos/callback` URL and be registered on the client.
2. Optionally set `BOS_TENANT_ID` to the BOS organization id of your institution.
3. Restart the API. The login page now shows **Sign in with BOS**.

How people are matched:

- By email (case-insensitive). BOS must report the email as verified.
- An existing connectX account signs in as itself; its role is not changed.
- With no account, a person whose `bos_tenant_id` equals `BOS_TENANT_ID` gets a new
  `alumnus` account (the lowest role) and an empty profile. Anyone else is refused.

Endpoints (all 404 while SSO is off, except `config`): `GET /api/v1/auth/bos/config`,
`GET /api/v1/auth/bos/login`, `GET /api/v1/auth/bos/callback`,
`POST /api/v1/auth/bos/exchange`. Tokens are verified against the provider's JWKS
(`iss`, `aud`/`azp`, `exp`, `nonce`).
