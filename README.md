# connectX — Rooman Alumni Network

An internal "LinkedIn for Rooman alumni" connecting the 500,000+ students Rooman
has trained over the last 25 years.

## What it does

1. **Invite alumni** — bulk-send branded invitations (email) to join the network.
2. **Pitch the value** during invite + onboarding:
   - **Community** — alumni helping each other.
   - **Paid mentorship** — conduct mentorship sessions on Rooman training
     programs, paid at industry standards.
   - **StartupVarsity** — build your product using Rooman's resources.
3. **Rich registration** — capture where the alum currently works and their
   expertise domain.
4. **Internal social feed** — post what you're doing / what you're looking for:
   - Senior professionals post **manpower requirements** for their teams.
   - Members post that they are **seeking opportunities** in a domain.

## Stack

| Layer    | Tech                                              |
|----------|---------------------------------------------------|
| Frontend | React + Vite + TypeScript, TanStack Query, Zustand|
| Backend  | FastAPI (Python), SQLAlchemy, Alembic, Pydantic   |
| Database | PostgreSQL                                         |
| Async    | Celery + Redis (invite/email fan-out)             |
| Auth     | JWT (access + refresh)                             |

## UI design language

A deliberate blend of three tactile styles — see [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md):

- **Neo-brutalism** — bold borders, hard offset shadows, high-contrast blocks
  (primary actions, cards, navigation).
- **Neumorphism** — soft extruded/inset surfaces (inputs, toggles, secondary panels).
- **Skeuomorphism** — real-world textures & affordances (mentorship "certificate",
  StartupVarsity "workbench", profile "ID card").

## Layout

```
connectX/
├── frontend/   # React + Vite app
├── backend/    # FastAPI app
├── docs/       # architecture, data model, design system, API
└── docker-compose.yml
```

## Quick start

```bash
# Backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install
cp .env.example .env
npm run dev

# Or everything via Docker
docker-compose up --build
```
