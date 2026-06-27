"""Seed the engagement modules (events, endorsements, spotlights, mentor
reviews, group posts, applications) using the existing seeded users.

Run:  python -m app.db.seed_engagement
Idempotent: each table is seeded only if currently empty.
"""
from datetime import datetime, timedelta, timezone

from app.db import base_all  # noqa: F401 — register all models/relationships
from app.db.session import SessionLocal
from app.models.user import User
from app.models.community import Community
from app.models.opportunity import Opportunity
from app.models.mentorship import MentorProfile, MentorshipSession
from app.models.event import Event, EventRSVP
from app.models.endorsement import Endorsement
from app.models.spotlight import Spotlight
from app.models.mentor_review import MentorReview
from app.models.group_post import GroupPost
from app.models.application import Application

NOW = datetime.now(timezone.utc)


def run() -> None:
    db = SessionLocal()
    try:
        # ---- resolve users by email (skip cleanly if missing) ----
        def u(email: str) -> User | None:
            return db.query(User).filter(User.email == email).one_or_none()

        admin = u("admin@rooman.com")
        mentor = u("mentor@rooman.com")
        recruiter = u("recruiter@rooman.com")
        alumnus = u("alumnus@rooman.com")
        moderator = u("moderator@rooman.com")
        asha = u("asha@example.com")
        vikram = u("vikram@example.com")
        neha = u("neha@example.com")
        imran = u("imran@example.com")

        people = [p for p in (mentor, recruiter, alumnus, moderator, asha, vikram, neha, imran) if p]
        log: list[str] = []

        # ---- EVENTS + RSVPs ----
        if db.query(Event).count() == 0 and admin:
            events = [
                Event(host_id=(mentor or admin).id,
                      title="DevOps Career AMA with Rooman Alumni",
                      description="Ask a Principal Engineer anything about breaking into DevOps.",
                      kind="ama", location="Online", meeting_url="https://meet.rooman.com/devops-ama",
                      starts_at=NOW + timedelta(days=3, hours=18 - NOW.hour),
                      ends_at=NOW + timedelta(days=3, hours=19), capacity=200, cover_emoji="🎓"),
                Event(host_id=(recruiter or admin).id,
                      title="Rooman Alumni Hiring Meetup — Bengaluru",
                      description="Meet recruiters hiring across cloud, data and full-stack roles.",
                      kind="meetup", location="Rooman HQ, Bengaluru",
                      starts_at=NOW + timedelta(days=10, hours=10),
                      ends_at=NOW + timedelta(days=10, hours=13), capacity=80, cover_emoji="🤝"),
                Event(host_id=admin.id,
                      title="StartupVarsity Demo Day",
                      description="Alumni founders pitch products built with Rooman resources.",
                      kind="launch", location="Online", meeting_url="https://meet.rooman.com/demo-day",
                      starts_at=NOW + timedelta(days=21, hours=16),
                      ends_at=NOW + timedelta(days=21, hours=18), cover_emoji="📈"),
            ]
            db.add_all(events)
            db.flush()
            # RSVPs across the community
            rsvps = []
            for ev, attendees in [
                (events[0], [alumnus, asha, vikram, imran, neha]),
                (events[1], [alumnus, imran, neha]),
                (events[2], [mentor, asha, vikram, alumnus]),
            ]:
                for a in attendees:
                    if a:
                        rsvps.append(EventRSVP(event_id=ev.id, user_id=a.id, status="going"))
            db.add_all(rsvps)
            log.append(f"events: {len(events)} + {len(rsvps)} RSVPs")

        # ---- ENDORSEMENTS ----
        if db.query(Endorsement).count() == 0:
            pairs = [
                (alumnus, mentor, "Kubernetes"), (recruiter, mentor, "AWS"),
                (asha, mentor, "Terraform"), (mentor, alumnus, "Python"),
                (vikram, alumnus, "Machine Learning"), (neha, recruiter, "System Design"),
                (asha, vikram, "Data Engineering"), (imran, asha, "Cloud Security"),
            ]
            es = [Endorsement(endorser_id=a.id, endorsee_id=b.id, skill=s)
                  for a, b, s in pairs if a and b]
            db.add_all(es)
            log.append(f"endorsements: {len(es)}")

        # ---- SPOTLIGHTS ----
        if db.query(Spotlight).count() == 0:
            sp = []
            if mentor:
                sp.append(Spotlight(user_id=mentor.id, is_featured=True, likes=42, cover_emoji="🏆",
                    title="From Rooman classroom to Principal Engineer",
                    story="After the Rooman Cloud & DevOps program I joined Infosys as a junior "
                          "engineer. Twelve years later I lead a platform team and mentor the next "
                          "generation of Rooman alumni.",
                    program_trained="Rooman Cloud & DevOps"))
            if neha:
                sp.append(Spotlight(user_id=neha.id, is_featured=True, likes=31, cover_emoji="🎓",
                    title="Cracking a product company as a full-stack dev",
                    story="Rooman's full-stack track gave me the fundamentals to clear Razorpay's "
                          "interviews. Grateful to the community that reviewed my prep.",
                    program_trained="Rooman Full-Stack"))
            if alumnus:
                sp.append(Spotlight(user_id=alumnus.id, likes=12, cover_emoji="📊",
                    title="Switching into Data Science",
                    story="Using the Rooman Data Science program and alumni mentors, I'm "
                          "transitioning from support into an ML engineering role.",
                    program_trained="Rooman Data Science"))
            db.add_all(sp)
            log.append(f"spotlights: {len(sp)}")

        # ---- MENTOR REVIEW (needs a mentor profile + a completed session) ----
        if db.query(MentorReview).count() == 0 and mentor and alumnus:
            mp = db.query(MentorProfile).filter(MentorProfile.user_id == mentor.id).one_or_none()
            if mp is None:
                mp = MentorProfile(user_id=mentor.id, programs="Rooman Cloud, Rooman DevOps",
                                   headline="Principal Engineer — Cloud / DevOps",
                                   bio="Happy to help alumni grow into cloud roles.",
                                   hourly_rate=2000.0)
                db.add(mp); db.flush()
            session = MentorshipSession(
                mentor_id=mp.id, mentee_id=alumnus.id, program="Rooman Cloud & DevOps",
                scheduled_at=NOW - timedelta(days=5), duration_minutes=60,
                amount=2000.0, status="completed", payment_status="paid")
            db.add(session); db.flush()
            db.add(MentorReview(session_id=session.id, mentor_id=mp.id, reviewer_id=alumnus.id,
                                rating=5, comment="Incredibly helpful — gave me a clear DevOps roadmap."))
            log.append("mentor_review: 1 (+1 session)")

        # ---- GROUP POSTS (in existing communities) ----
        if db.query(GroupPost).count() == 0:
            cloud = db.query(Community).filter(Community.slug == "cloud-devops").one_or_none()
            ai = db.query(Community).filter(Community.slug == "ai-data").one_or_none()
            gp = []
            if cloud and mentor:
                gp.append(GroupPost(community_id=cloud.id, author_id=mentor.id,
                    body="Sharing my interview prep notes for AWS Solutions Architect — DM me."))
            if cloud and asha:
                gp.append(GroupPost(community_id=cloud.id, author_id=asha.id,
                    body="We just open-sourced our Terraform modules. Feedback welcome!"))
            if ai and vikram:
                gp.append(GroupPost(community_id=ai.id, author_id=vikram.id,
                    body="Anyone interested in a study group for LLM evaluation? Forming one this week."))
            if ai and alumnus:
                gp.append(GroupPost(community_id=ai.id, author_id=alumnus.id,
                    body="Looking for a mentor to review my first ML project. Any takers?"))
            db.add_all(gp)
            log.append(f"group_posts: {len(gp)}")

        # ---- APPLICATIONS (to existing hiring opportunities) ----
        if db.query(Application).count() == 0:
            hiring = db.query(Opportunity).filter(Opportunity.kind == "hiring").first()
            if hiring:
                apps = []
                if alumnus:
                    apps.append(Application(opportunity_id=hiring.id, applicant_id=alumnus.id,
                        note="5 yrs experience, keen to move into DevOps.", status="applied"))
                if imran:
                    apps.append(Application(opportunity_id=hiring.id, applicant_id=imran.id,
                        referred_by=(mentor.id if mentor else None),
                        note="Referred by a mentor — strong cloud security background.",
                        status="shortlisted"))
                db.add_all(apps)
                log.append(f"applications: {len(apps)}")

        db.commit()
    finally:
        db.close()

    print("=== Engagement seeding ===")
    if log:
        for line in log:
            print("  [seeded]", line)
    else:
        print("  Nothing seeded — tables already populated.")


if __name__ == "__main__":
    run()
