# connectX Architecture

```
┌────────────────────┐        HTTPS / JSON        ┌──────────────────────┐
│  React + Vite SPA   │  ───────────────────────▶  │   FastAPI (app/)     │
│  frontend/          │  ◀───────────────────────  │   REST /api/v1       │
└────────────────────┘                            └──────────┬───────────┘
        │                                                     │
        │ design system: nb / neu / skeu                      │ SQLAlchemy
        ▼                                                     ▼
   3 style layers                                      ┌──────────────┐
   (styles/*.css)                                      │ PostgreSQL   │
                                                        └──────────────┘
                                   async fan-out (invites, emails, matching)
                                              │
                                     ┌────────▼────────┐
                                     │ Celery + Redis  │
                                     └─────────────────┘
```

## Backend layering (`backend/app/`)

- `api/v1/routes/` — thin HTTP handlers, one module per domain.
- `schemas/` — Pydantic request/response models (validation boundary).
- `crud/` — DB read/write helpers built on `crud/base.py`.
- `services/` — business logic (invites, email, matching, payments, notifications).
- `models/` — SQLAlchemy ORM tables.
- `workers/` — Celery tasks for bulk invite sends and matching jobs.

## Frontend layering (`frontend/src/`)

- `features/<domain>/` — feature-sliced pages + components + local state.
- `components/ui/` — shared design-system primitives (the 3 styles).
- `api/` — typed clients wrapping `api/client.ts` (axios + auth interceptor).
- `store/` — global state (Zustand); server state via TanStack Query.

## Key flows

1. **Bulk invite** — admin uploads alumni contacts → `invite_service` creates
   `Invite` rows → Celery sends branded emails → alum clicks tokenized link →
   `InviteAcceptPage` → onboarding wizard → `AlumniProfile` created.
2. **Feed** — `Post` / `Opportunity` created → matching service notifies relevant
   alumni by `expertise_domain`.
3. **Mentorship** — alum opts in as mentor → others book paid sessions →
   payment + certificate (skeuomorphic) issued.
