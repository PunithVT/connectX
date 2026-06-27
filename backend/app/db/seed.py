"""Seed the database with an admin + demo alumni, posts, opportunities, etc.

Run:  python -m app.db.seed
Idempotent-ish: it skips seeding if an admin already exists.
"""
from datetime import datetime, timedelta, timezone

from app.db.base import Base
from app.db import base_all  # noqa: F401 — populate metadata
from app.db.session import SessionLocal, engine
from app.models.alumni_profile import AlumniProfile
from app.models.application import Application
from app.models.community import Community, GroupMembership
from app.models.connection import Connection
from app.models.endorsement import Endorsement
from app.models.event import Event, EventRSVP
from app.models.group_post import GroupPost
from app.models.invite import Invite
from app.models.mentor_review import MentorReview
from app.models.message import Message
from app.models.mentorship import MentorProfile, MentorshipSession
from app.models.opportunity import Opportunity
from app.models.post import Post
from app.models.spotlight import Spotlight
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

        db.commit()

        # Connections (engagement): asha<->vikram accepted, neha->asha pending
        db.add_all([
            Connection(
                requester_id=users[0][0].id, addressee_id=users[1][0].id,
                status="accepted",
                responded_at=datetime.now(timezone.utc),
            ),
            Connection(
                requester_id=users[2][0].id, addressee_id=users[0][0].id,
                status="pending",
            ),
        ])
        db.commit()

        # A short conversation between connected alumni (asha & vikram)
        db.add_all([
            Message(sender_id=users[1][0].id, recipient_id=users[0][0].id,
                    body="Hey Asha! Saw your Kubernetes post — would love to chat.",
                    is_read=True),
            Message(sender_id=users[0][0].id, recipient_id=users[1][0].id,
                    body="Thanks Vikram! Happy to. Are you free this week?",
                    is_read=False),
        ])

        # Events & webinars (req #2a) — hosted by Asha
        now = datetime.now(timezone.utc)
        ev1 = Event(
            host_id=users[0][0].id, title="DevOps AMA: Scaling on Kubernetes",
            description="Ask me anything about running production K8s.",
            kind="ama", location="Online", meeting_url="https://meet.rooman.com/devops-ama",
            starts_at=now + timedelta(days=3), ends_at=now + timedelta(days=3, hours=1),
            capacity=100, cover_emoji="☸️",
        )
        ev2 = Event(
            host_id=users[1][0].id, title="Rooman Alumni Meetup — Bengaluru",
            description="Evening of networking, food and lightning talks.",
            kind="meetup", location="Rooman HQ, Bengaluru",
            starts_at=now + timedelta(days=10), capacity=50, cover_emoji="🤝",
        )
        db.add_all([ev1, ev2])
        db.commit()
        db.add_all([
            EventRSVP(event_id=ev1.id, user_id=users[0][0].id, status="going"),
            EventRSVP(event_id=ev1.id, user_id=users[1][0].id, status="going"),
            EventRSVP(event_id=ev2.id, user_id=users[1][0].id, status="going"),
        ])

        # Skill endorsements (Asha & Vikram are connected)
        db.add_all([
            Endorsement(endorser_id=users[1][0].id, endorsee_id=users[0][0].id,
                        skill="Kubernetes"),
            Endorsement(endorser_id=users[1][0].id, endorsee_id=users[0][0].id,
                        skill="CI/CD"),
        ])

        # Group discussion feed: Asha & Vikram join the Cloud guild and post
        guild = db.query(Community).filter(Community.slug == "cloud-devops").first()
        if guild:
            db.add_all([
                GroupMembership(community_id=guild.id, user_id=users[0][0].id,
                                role="moderator"),
                GroupMembership(community_id=guild.id, user_id=users[1][0].id),
            ])
            db.commit()
            db.add_all([
                GroupPost(community_id=guild.id, author_id=users[0][0].id,
                          body="Welcome to the Cloud & DevOps guild! Drop your toughest infra question."),
                GroupPost(community_id=guild.id, author_id=users[1][0].id,
                          body="Anyone running Karpenter in prod? Curious about cost savings."),
            ])

        # A completed mentorship session + 5★ review to seed the leaderboard
        asha_mentor = (
            db.query(MentorProfile)
            .filter(MentorProfile.user_id == users[0][0].id)
            .first()
        )
        if asha_mentor:
            sess = MentorshipSession(
                mentor_id=asha_mentor.id, mentee_id=users[2][0].id,
                program="Rooman Cloud", scheduled_at=now - timedelta(days=2),
                duration_minutes=60, amount=1500.0, status="completed",
                payment_status="paid",
            )
            db.add(sess)
            db.commit()
            db.add(MentorReview(
                session_id=sess.id, mentor_id=asha_mentor.id,
                reviewer_id=users[2][0].id, rating=5,
                comment="Incredibly helpful — demystified our CI pipeline.",
            ))

        # Success story / spotlight (featured)
        db.add(Spotlight(
            user_id=users[2][0].id, title="From Rooman classroom to Razorpay SDE-2",
            story="The Full-Stack program gave me the foundation to crack product "
                  "engineering interviews. Five years on, I now mentor juniors here.",
            program_trained="Rooman Full-Stack", cover_emoji="🚀",
            is_featured=True, likes=12,
        ))

        # A job application on Asha's hiring post (Imran applies)
        hiring = (
            db.query(Opportunity)
            .filter(Opportunity.author_id == users[0][0].id,
                    Opportunity.kind == "hiring")
            .first()
        )
        if hiring:
            db.add(Application(
                opportunity_id=hiring.id, applicant_id=users[3][0].id,
                note="5 yrs in security, keen to move into platform/DevOps.",
                status="applied",
            ))

        db.commit()

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
