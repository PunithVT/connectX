"""Seed the database with an admin + demo alumni, posts, opportunities, etc.

Run:  python -m app.db.seed
Idempotent-ish: it skips seeding if an admin already exists.
"""
from datetime import datetime, timedelta, timezone

from app.db.base import Base
from app.db import base_all  # noqa: F401 — populate metadata
from app.db.session import SessionLocal, engine
from app.models.alumni_profile import AlumniProfile
from app.models.community import Community
from app.models.invite import Invite
from app.models.mentorship import MentorProfile
from app.models.opportunity import Opportunity
from app.models.post import Post
from app.models.startup_project import StartupProject
from app.crud.user import user_crud
from app.utils.tokens import generate_invite_token


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if user_crud.get_by_email(db, "admin@rooman.com"):
            print("Seed skipped — admin already exists.")
            return

        admin = user_crud.create_user(
            db, email="admin@rooman.com", password="admin123",
            full_name="Rooman Admin", role="admin",
        )

        demo = [
            ("asha@example.com", "Asha Rao", "Cloud / DevOps",
             "Infosys", "Senior DevOps Engineer", "Bengaluru"),
            ("vikram@example.com", "Vikram Singh", "Data Science / AI",
             "Mu Sigma", "Data Scientist", "Bengaluru"),
            ("neha@example.com", "Neha Kulkarni", "Full-Stack Development",
             "Razorpay", "SDE-2", "Pune"),
            ("imran@example.com", "Imran Khan", "Cybersecurity",
             "TCS", "Security Analyst", "Hyderabad"),
        ]
        users = []
        for email, name, domain, company, title, loc in demo:
            u = user_crud.create_user(
                db, email=email, password="alumni123", full_name=name
            )
            db.add(AlumniProfile(
                user_id=u.id,
                program_trained="Rooman Advanced Diploma", batch_year=2018,
                current_company=company, current_title=title,
                expertise_domain=domain, skills=domain, location=loc,
                headline=f"{title} @ {company}",
                open_to_mentoring=True, open_to_opportunities=True,
            ))
            users.append((u, domain))
        db.commit()

        # Mentor profiles
        for u, domain in users[:2]:
            db.add(MentorProfile(
                user_id=u.id, programs="Rooman Cloud, Rooman Data",
                headline=f"Mentor — {domain}",
                bio="Happy to help fellow alumni level up.",
                hourly_rate=1500.0,
            ))

        # Feed posts
        db.add_all([
            Post(author_id=users[0][0].id, post_type="doing",
                 body="Just migrated our platform to Kubernetes — AMA on DevOps!"),
            Post(author_id=users[1][0].id, post_type="looking",
                 body="Looking to collaborate on an open-source LLM eval toolkit."),
            Post(author_id=users[2][0].id, post_type="update",
                 body="Grateful to the Rooman community — 5 years in tech today!"),
        ])

        # Opportunities (hiring + seeking) — same domain to demo matching
        db.add_all([
            Opportunity(author_id=users[0][0].id, kind="hiring",
                        title="Hiring: DevOps Engineer (2-4 yrs)",
                        description="Join our platform team.",
                        expertise_domain="Cloud / DevOps", company="Infosys",
                        location="Bengaluru"),
            Opportunity(author_id=users[3][0].id, kind="seeking",
                        title="Seeking: Cloud / DevOps role",
                        description="Open to senior DevOps positions.",
                        expertise_domain="Cloud / DevOps", location="Remote"),
        ])

        # StartupVarsity project
        db.add(StartupProject(
            owner_id=users[2][0].id, name="SkillBridge",
            pitch="A micro-mentorship marketplace for tier-2 city students.",
            stage="mvp",
            resources_requested="Cloud credits, mentor network, design help",
        ))

        # Communities
        db.add_all([
            Community(name="Cloud & DevOps Guild", slug="cloud-devops",
                      description="Alumni working in cloud infrastructure."),
            Community(name="AI / Data Circle", slug="ai-data",
                      description="ML, data engineering and analytics alumni."),
        ])

        # A pending invite to demo the accept flow
        db.add(Invite(
            email="newgrad@example.com", full_name="Priya Sharma",
            program_trained="Rooman Java Pro", batch_year=2021,
            token=generate_invite_token(), status="sent",
            invited_by=admin.id,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        ))

        db.commit()
        print("Seed complete.")
        print("  Admin login:  admin@rooman.com / admin123")
        print("  Alumni login: asha@example.com / alumni123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
