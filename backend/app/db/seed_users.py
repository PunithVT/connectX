"""Seed one user per role type, each with a known password.

Run:  python -m app.db.seed_users
Idempotent: existing emails are skipped (password NOT reset).
"""
from app.db.base import Base
from app.db import base_all  # noqa: F401 — populate metadata
from app.db.session import SessionLocal, engine
from app.core.roles import Role
from app.crud.user import user_crud
from app.models.alumni_profile import AlumniProfile

# (role, email, password, full_name, company, title, domain)
SEED_USERS = [
    (Role.ADMIN,     "admin@rooman.com",     "Admin@123",     "Rooman Admin",        None,        None,                   None),
    (Role.MODERATOR, "moderator@rooman.com", "Moderator@123", "Community Moderator", "Rooman",    "Community Manager",     "Community Ops"),
    (Role.MENTOR,    "mentor@rooman.com",    "Mentor@123",    "Senior Mentor",       "Infosys",   "Principal Engineer",    "Cloud / DevOps"),
    (Role.RECRUITER, "recruiter@rooman.com", "Recruiter@123", "Hiring Manager",      "Razorpay",  "Engineering Manager",   "Full-Stack Development"),
    (Role.ALUMNUS,   "alumnus@rooman.com",   "Alumnus@123",   "Alumni Member",       "TCS",       "Software Engineer",     "Data Science / AI"),
]


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    created, skipped = [], []
    try:
        for role, email, password, name, company, title, domain in SEED_USERS:
            if user_crud.get_by_email(db, email):
                skipped.append(email)
                continue
            user = user_crud.create_user(
                db, email=email, password=password,
                full_name=name, role=role.value,
            )
            # Non-admin users get an alumni profile for a complete demo account.
            if company:
                db.add(AlumniProfile(
                    user_id=user.id,
                    current_company=company, current_title=title,
                    expertise_domain=domain, skills=domain,
                    headline=f"{title} @ {company}",
                    open_to_mentoring=(role == Role.MENTOR),
                    open_to_opportunities=(role == Role.ALUMNUS),
                ))
            created.append((email, password, role.value))
        db.commit()
    finally:
        db.close()

    print("=== Seed users ===")
    for email, password, role in created:
        print(f"  [created] {role:<9} {email:<24} {password}")
    for email in skipped:
        print(f"  [skipped] already exists: {email}")
    if not created:
        print("  Nothing created — all users already exist.")


if __name__ == "__main__":
    run()
