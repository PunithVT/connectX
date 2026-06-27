<div align="center">

# connectX — Alumni Network Platform

### The all-in-one alumni network & engagement software — an internal LinkedIn for your community.

Built by **[Rooman Technologies](https://rooman.net)** to reconnect the **500,000+ students** trained over the last **25 years**.

[![Live Demo](https://img.shields.io/badge/Live_Demo-online-18a558?style=for-the-badge)](http://3.110.68.62)
[![React](https://img.shields.io/badge/React-18-2d6cdf?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)

**[🌐 Live Demo](http://3.110.68.62)** · **[📖 Docs](docs/)** · **[🏗 Architecture](docs/ARCHITECTURE.md)** · **[🗃 Data Model](docs/DATA_MODEL.md)**

</div>

---

## 🎓 What is connectX?

**connectX** is a modern, open **alumni network platform** — think *LinkedIn, but private to your institution's alumni*. It helps training organizations, universities, and bootcamps **re-engage graduates, grow a professional community, run paid mentorship, surface jobs, and host events** — all in one place.

Whether you've trained **500 or 500,000** alumni, connectX turns a dormant contact list into a living, value-generating network.

> **Keywords:** alumni network software · alumni management system · alumni engagement platform · alumni community · internal LinkedIn · mentorship platform · job board · networking app.

## ✨ Features

| | Feature | Description |
|---|---|---|
| 📨 | **Smart Invitations** | Bulk-invite alumni by email with branded, tokenized links and one-click join. |
| 🪪 | **Rich Profiles** | Capture current company, role, **expertise domain**, skills, and batch — the data that powers matching. |
| 📰 | **Social Feed** | Post updates, what you're working on, or what you're looking for — like, comment, engage. |
| 🤝 | **Connections & Messaging** | Connect with fellow alumni and chat 1:1 in real time. |
| 🎯 | **Paid Mentorship** | Alumni mentor on your programs at industry rates — bookings, sessions, reviews & a leaderboard. |
| 💼 | **Opportunities & Jobs** | Seniors post manpower needs; members seek roles. Auto-matched by domain, with an apply flow. |
| 🚀 | **StartupVarsity** | Alumni founders apply for resources (compute, mentors, labs) to build their products. |
| 📅 | **Events & Webinars** | Host AMAs, meetups, and demo days with RSVPs and capacity management. |
| 👥 | **Communities** | Topic-based groups with their own discussion feeds. |
| 🏆 | **Endorsements & Spotlights** | Skill endorsements and alumni success stories for social proof and re-engagement. |
| 🔐 | **Roles & Admin** | Admin, moderator, mentor, recruiter, and alumnus roles with fine-grained access. |

## 🖥 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · Vite · TypeScript · TanStack Query · Zustand · React Router |
| **Backend** | FastAPI · Python 3 · SQLAlchemy 2 · Pydantic v2 · Alembic |
| **Database** | PostgreSQL (AWS RDS) |
| **Auth** | JWT access + refresh tokens, bcrypt password hashing |
| **Email** | SMTP (Gmail) with Jinja2 HTML templates for invitations |
| **Async** | Celery + Redis (bulk invite / email fan-out) |
| **Infra** | AWS EC2 · Nginx reverse proxy · systemd |

## 🏛 Architecture

```
React + Vite SPA  ──HTTPS/JSON──►  FastAPI (REST /api/v1)  ──SQLAlchemy──►  PostgreSQL
        │                                   │
   feature-sliced UI                  services / crud / models
                                            │
                                   Celery + Redis (async email)
```

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the full picture and **[docs/DATA_MODEL.md](docs/DATA_MODEL.md)** for the schema.

## 🚀 Quick Start

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # set DATABASE_URL, SMTP, JWT_SECRET
uvicorn app.main:app --reload # http://localhost:8000  (docs at /docs)

# 2. Frontend
cd frontend
npm install
cp .env.example .env          # set VITE_API_BASE_URL
npm run dev                   # http://localhost:5173

# 3. Seed demo data (optional)
python -m app.db.seed             # admin + demo alumni
python -m app.db.seed_engagement  # events, endorsements, spotlights…
```

## 📂 Project Structure

```
connectX/
├── frontend/        # React + Vite + TypeScript SPA (feature-sliced)
│   └── src/
│       ├── features/   # auth, feed, profile, mentorship, events, …
│       ├── components/ # design-system + layout
│       └── api/        # typed API clients
├── backend/         # FastAPI application
│   └── app/
│       ├── api/        # versioned REST routes
│       ├── models/     # SQLAlchemy ORM
│       ├── schemas/    # Pydantic
│       ├── services/   # business logic (invites, email, matching, payments)
│       └── db/         # session + seeders
└── docs/            # architecture, data model, design system, API
```

## 🗺 Roadmap

- [ ] Razorpay payments for mentorship sessions
- [ ] AI-powered matching (mentors, jobs, co-founders) & smart digests
- [ ] CSV/Excel bulk-invite with consent & unsubscribe (DPDP-compliant)
- [ ] HTTPS + custom domain, analytics dashboard, S3 media uploads
- [ ] Mobile app / PWA

## 🤝 Contributing

Issues and pull requests are welcome. Please open an issue to discuss substantial changes first.

## 📜 License

Proprietary — © Rooman Technologies. All rights reserved.

---

<div align="center">

**connectX** — *reconnect. mentor. grow.*

Made with ❤️ for the Rooman alumni community.

</div>
