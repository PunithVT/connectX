"""Ensure every user has a complete AlumniProfile (fixes `profiles/me` 404).

Run:  python -m app.db.seed_profiles
- Creates a profile for users that have none (e.g. admin).
- Backfills only MISSING fields on existing profiles (won't overwrite real data).
"""
from app.db import base_all  # noqa: F401 — register all models/relationships
from app.db.session import SessionLocal
from app.models.user import User
from app.models.alumni_profile import AlumniProfile

# Rich, per-user details keyed by email.
DETAILS: dict[str, dict] = {
    "admin@rooman.com": dict(
        program_trained="Rooman Staff", batch_year=2010,
        current_company="Rooman Technologies", current_title="Platform Administrator",
        expertise_domain="Platform Administration", skills="Operations, User Management, Analytics",
        location="Bengaluru", headline="Administrator @ Rooman Alumni Network",
        bio="Managing the Rooman alumni network and keeping the community thriving.",
        linkedin_url="https://www.linkedin.com/company/rooman-technologies",
        open_to_mentoring=False, open_to_opportunities=False, interested_in_startupvarsity=False,
    ),
    "moderator@rooman.com": dict(
        program_trained="Rooman Diploma", batch_year=2016,
        current_company="Rooman Technologies", current_title="Community Manager",
        expertise_domain="Community Operations", skills="Moderation, Content, Engagement",
        location="Bengaluru", headline="Community Moderator @ Rooman",
        bio="Helping alumni connect, keeping discussions healthy and on-topic.",
        open_to_mentoring=True, open_to_opportunities=False, interested_in_startupvarsity=False,
    ),
    "mentor@rooman.com": dict(
        program_trained="Rooman Cloud & DevOps", batch_year=2014,
        current_company="Infosys", current_title="Principal Engineer",
        expertise_domain="Cloud / DevOps", skills="AWS, Kubernetes, Terraform, CI/CD",
        location="Bengaluru", headline="Principal Engineer @ Infosys · Mentor",
        bio="15 yrs in cloud infrastructure. Love mentoring Rooman alumni into DevOps roles.",
        linkedin_url="https://www.linkedin.com/in/rooman-mentor",
        open_to_mentoring=True, open_to_opportunities=False, interested_in_startupvarsity=True,
    ),
    "recruiter@rooman.com": dict(
        program_trained="Rooman Full-Stack", batch_year=2013,
        current_company="Razorpay", current_title="Engineering Manager",
        expertise_domain="Full-Stack Development", skills="Hiring, React, Node.js, System Design",
        location="Bengaluru", headline="Engineering Manager @ Razorpay · Hiring",
        bio="Building high-performing teams. Actively hiring Rooman alumni for backend & full-stack roles.",
        linkedin_url="https://www.linkedin.com/in/rooman-recruiter",
        open_to_mentoring=True, open_to_opportunities=False, interested_in_startupvarsity=False,
    ),
    "alumnus@rooman.com": dict(
        program_trained="Rooman Data Science", batch_year=2019,
        current_company="TCS", current_title="Software Engineer",
        expertise_domain="Data Science / AI", skills="Python, Pandas, ML, SQL",
        location="Hyderabad", headline="Software Engineer @ TCS",
        bio="Data enthusiast looking to grow into ML engineering. Open to new opportunities.",
        linkedin_url="https://www.linkedin.com/in/rooman-alumnus",
        open_to_mentoring=False, open_to_opportunities=True, interested_in_startupvarsity=True,
    ),
}

# Generic fallback for any other user not in DETAILS.
def _fallback(user: User) -> dict:
    return dict(
        program_trained="Rooman Program", batch_year=2018,
        current_company="—", current_title="Rooman Alumnus",
        expertise_domain="General", skills="",
        location="India", headline=f"{user.full_name} · Rooman Alumnus",
        bio="Proud Rooman alumnus.",
        open_to_mentoring=False, open_to_opportunities=True, interested_in_startupvarsity=False,
    )


def run() -> None:
    db = SessionLocal()
    created, backfilled = [], []
    try:
        for user in db.query(User).all():
            details = DETAILS.get(user.email) or _fallback(user)
            profile = (
                db.query(AlumniProfile)
                .filter(AlumniProfile.user_id == user.id)
                .one_or_none()
            )
            if profile is None:
                db.add(AlumniProfile(user_id=user.id, **details))
                created.append(user.email)
            else:
                changed = False
                for field, value in details.items():
                    if getattr(profile, field, None) in (None, "", "—"):
                        setattr(profile, field, value)
                        changed = True
                if changed:
                    backfilled.append(user.email)
        db.commit()
    finally:
        db.close()

    print("=== Profile seeding ===")
    for e in created:
        print(f"  [created]    {e}")
    for e in backfilled:
        print(f"  [backfilled] {e}")
    if not created and not backfilled:
        print("  All profiles already complete.")


if __name__ == "__main__":
    run()
