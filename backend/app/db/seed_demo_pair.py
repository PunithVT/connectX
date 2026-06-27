"""Create 2 demo alumni with a complete set of interactions for a live demo:
connected, a chat thread, feed posts + a comment, and mutual endorsements.

Run:  python -m app.db.seed_demo_pair
Idempotent: if both demo users already exist, it does nothing.
"""
from datetime import datetime, timedelta, timezone

from app.db import base_all  # noqa: F401 — register all models/relationships
from app.db.session import SessionLocal
from app.crud.user import user_crud
from app.models.alumni_profile import AlumniProfile
from app.models.connection import Connection
from app.models.message import Message
from app.models.post import Post
from app.models.comment import Comment
from app.models.endorsement import Endorsement

NOW = datetime.now(timezone.utc)

PRIYA = "priya.sharma@rooman.com"
ARJUN = "arjun.mehta@rooman.com"
PASSWORD = "Demo@1234"


def run() -> None:
    db = SessionLocal()
    try:
        if user_crud.get_by_email(db, PRIYA) and user_crud.get_by_email(db, ARJUN):
            print("Demo pair already exists — nothing to do.")
            print(f"  {PRIYA} / {PASSWORD}")
            print(f"  {ARJUN} / {PASSWORD}")
            return

        # --- 1. Users ---
        priya = user_crud.get_by_email(db, PRIYA) or user_crud.create_user(
            db, email=PRIYA, password=PASSWORD, full_name="Priya Sharma")
        arjun = user_crud.get_by_email(db, ARJUN) or user_crud.create_user(
            db, email=ARJUN, password=PASSWORD, full_name="Arjun Mehta")

        # --- 2. Profiles ---
        db.add_all([
            AlumniProfile(
                user_id=priya.id, program_trained="Rooman Full-Stack", batch_year=2019,
                current_company="Razorpay", current_title="Full-Stack Developer",
                expertise_domain="Full-Stack Development",
                skills="React, TypeScript, Node.js, PostgreSQL",
                location="Bengaluru", headline="Full-Stack Developer @ Razorpay",
                bio="Building payment experiences. Rooman full-stack grad, love React & clean APIs.",
                linkedin_url="https://www.linkedin.com/in/priya-sharma-demo",
                open_to_mentoring=True, open_to_opportunities=False,
                interested_in_startupvarsity=True),
            AlumniProfile(
                user_id=arjun.id, program_trained="Rooman Cloud & DevOps", batch_year=2018,
                current_company="Infosys", current_title="DevOps Engineer",
                expertise_domain="Cloud / DevOps",
                skills="AWS, Kubernetes, Terraform, CI/CD",
                location="Bengaluru", headline="DevOps Engineer @ Infosys",
                bio="Automating all the things. Rooman DevOps alumnus, happy to help with cloud.",
                linkedin_url="https://www.linkedin.com/in/arjun-mehta-demo",
                open_to_mentoring=True, open_to_opportunities=True,
                interested_in_startupvarsity=False),
        ])

        # --- 3. Connection (Priya -> Arjun, accepted) ---
        db.add(Connection(
            requester_id=priya.id, addressee_id=arjun.id,
            status="accepted",
            created_at=NOW - timedelta(days=6),
            responded_at=NOW - timedelta(days=6, hours=-2)))

        # --- 4. Chat thread (staggered; last one from Arjun is unread by Priya) ---
        convo = [
            (priya, arjun, "Hi Arjun! We connected through the Rooman network — loved your Kubernetes post.", True, 5, 0),
            (arjun, priya, "Thanks Priya! Glad it helped. Are you still at Razorpay?", True, 5, -1),
            (priya, arjun, "Yes! We're scaling our infra and I'd love your input on our CI/CD setup.", True, 4, 0),
            (arjun, priya, "Happy to help. I mentor on exactly this — want to book a session?", True, 4, -2),
            (priya, arjun, "Definitely. Sending a request now. Also — coffee at the Bengaluru meetup?", True, 2, 0),
            (arjun, priya, "Sounds great, see you there! I'll bring my Terraform cheatsheet 🙂", False, 0, -3),
        ]
        for sender, recipient, body, is_read, days_ago, hours in convo:
            db.add(Message(
                sender_id=sender.id, recipient_id=recipient.id, body=body,
                is_read=is_read,
                created_at=NOW - timedelta(days=days_ago, hours=hours)))

        db.flush()

        # --- 5. Feed posts + a comment ---
        priya_post = Post(
            author_id=priya.id, post_type="looking", likes=7,
            body="Looking for a DevOps mentor to review our CI/CD pipeline at Razorpay. "
                 "Any Rooman alumni up for it?",
            created_at=NOW - timedelta(days=5, hours=2))
        arjun_post = Post(
            author_id=arjun.id, post_type="doing", likes=12,
            body="Just shipped a zero-downtime Kubernetes migration. Writing up the playbook — "
                 "DM me if you want early access.",
            created_at=NOW - timedelta(days=6))
        db.add_all([priya_post, arjun_post])
        db.flush()

        db.add(Comment(
            post_id=priya_post.id, author_id=arjun.id,
            body="I can help with this, Priya! Booking a mentorship session is the easiest way.",
            created_at=NOW - timedelta(days=5, hours=1)))

        # --- 6. Mutual endorsements ---
        db.add_all([
            Endorsement(endorser_id=priya.id, endorsee_id=arjun.id, skill="Kubernetes"),
            Endorsement(endorser_id=priya.id, endorsee_id=arjun.id, skill="AWS"),
            Endorsement(endorser_id=arjun.id, endorsee_id=priya.id, skill="React"),
            Endorsement(endorser_id=arjun.id, endorsee_id=priya.id, skill="TypeScript"),
        ])

        db.commit()
        print("=== Demo pair created ===")
        print(f"  {PRIYA} / {PASSWORD}  (Priya Sharma — Full-Stack @ Razorpay)")
        print(f"  {ARJUN} / {PASSWORD}  (Arjun Mehta — DevOps @ Infosys)")
        print("  connection: accepted | messages: 6 (1 unread) | posts: 2 | comment: 1 | endorsements: 4")
    finally:
        db.close()


if __name__ == "__main__":
    run()
