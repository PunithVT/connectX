"""E2E tests for the engagement expansion modules:

events & webinars, skill endorsements, mentor reviews + leaderboard,
group discussion feeds, success-story spotlight, and job applications/referrals.
"""
from datetime import datetime, timezone, timedelta

from app.models.invite import Invite


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _register(client, db_session, admin_token, email, name, domain):
    client.post(
        "/api/v1/invites",
        json={"email": email, "full_name": name, "program_trained": "AWS Cloud"},
        headers=_auth(admin_token),
    )
    token = db_session.query(Invite).filter(Invite.email == email).one().token
    client.post(
        "/api/v1/invites/accept",
        json={
            "token": token, "password": "secret12", "full_name": name,
            "current_company": "Acme", "expertise_domain": domain,
            "skills": "AWS, Docker, Kubernetes",
        },
    )
    login = client.post(
        "/api/v1/auth/login", data={"username": email, "password": "secret12"}
    )
    return login.json()["access_token"]


def _ids(client, tok, *names):
    profiles = client.get("/api/v1/profiles", headers=_auth(tok)).json()
    out = []
    for n in names:
        out.append(next(p for p in profiles if p["user"]["full_name"] == n)["user"]["id"])
    return out


def _connect(client, tok_a, tok_b, b_id, a_id):
    """a requests b, b accepts."""
    client.post(f"/api/v1/connections/{b_id}", headers=_auth(tok_a))
    pending = client.get("/api/v1/connections/pending", headers=_auth(tok_b)).json()
    conn_id = pending[0]["connection_id"]
    client.post(f"/api/v1/connections/{conn_id}/accept", headers=_auth(tok_b))


def test_events_rsvp_capacity_and_waitlist(client, db_session, admin_token):
    host = _register(client, db_session, admin_token, "host@e.com", "Hosty", "Cloud / DevOps")
    a = _register(client, db_session, admin_token, "att1@e.com", "Attendee One", "Cloud / DevOps")
    b = _register(client, db_session, admin_token, "att2@e.com", "Attendee Two", "Cloud / DevOps")

    starts = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    ev = client.post(
        "/api/v1/events",
        json={"title": "Tiny webinar", "kind": "webinar", "starts_at": starts, "capacity": 1},
        headers=_auth(host),
    )
    assert ev.status_code == 201, ev.text
    eid = ev.json()["id"]
    # Host auto-attends -> fills the single seat
    assert ev.json()["attendee_count"] == 1
    assert ev.json()["is_attending"] is True
    assert ev.json()["spots_left"] == 0

    # Attendee One is full -> waitlisted
    r1 = client.post(f"/api/v1/events/{eid}/rsvp", headers=_auth(a))
    assert r1.status_code == 200
    assert r1.json()["attendee_count"] == 1  # still 1 going

    # Host is notified
    notes = client.get("/api/v1/notifications", headers=_auth(host)).json()
    assert any(n["type"] == "event" for n in notes)

    # Host cancels -> waitlisted Attendee One is promoted
    cancel = client.delete(f"/api/v1/events/{eid}/rsvp", headers=_auth(host))
    assert cancel.status_code == 200
    detail = client.get(f"/api/v1/events/{eid}", headers=_auth(a)).json()
    assert detail["is_attending"] is True
    assert detail["attendee_count"] == 1

    # Listing upcoming shows the event; my-events shows it for attendee
    upcoming = client.get("/api/v1/events", headers=_auth(b)).json()
    assert any(e["id"] == eid for e in upcoming)
    mine = client.get("/api/v1/events/mine/list", headers=_auth(a)).json()
    assert any(e["id"] == eid for e in mine)


def test_endorsements_require_connection(client, db_session, admin_token):
    a = _register(client, db_session, admin_token, "en_a@e.com", "Endorser", "Cloud / DevOps")
    b = _register(client, db_session, admin_token, "en_b@e.com", "Endorsee", "Cloud / DevOps")
    b_id, a_id = _ids(client, a, "Endorsee", "Endorser")

    # Cannot endorse before connecting
    early = client.post(
        f"/api/v1/endorsements/{b_id}", json={"skill": "Kubernetes"}, headers=_auth(a)
    )
    assert early.status_code == 403

    _connect(client, a, b, b_id, a_id)

    res = client.post(
        f"/api/v1/endorsements/{b_id}", json={"skill": "Kubernetes"}, headers=_auth(a)
    )
    assert res.status_code == 200, res.text
    skills = res.json()
    k = next(s for s in skills if s["skill"] == "Kubernetes")
    assert k["count"] == 1
    assert k["endorsed_by_me"] is True

    # Endorsee got a notification
    notes = client.get("/api/v1/notifications", headers=_auth(b)).json()
    assert any(n["type"] == "endorsement" for n in notes)

    # Idempotent — endorsing again keeps count at 1
    res2 = client.post(
        f"/api/v1/endorsements/{b_id}", json={"skill": "Kubernetes"}, headers=_auth(a)
    )
    assert next(s for s in res2.json() if s["skill"] == "Kubernetes")["count"] == 1

    # Remove endorsement
    res3 = client.request(
        "DELETE", f"/api/v1/endorsements/{b_id}",
        json={"skill": "Kubernetes"}, headers=_auth(a),
    )
    assert all(s["skill"] != "Kubernetes" for s in res3.json())

    # Cannot endorse yourself
    self_e = client.post(
        f"/api/v1/endorsements/{a_id}", json={"skill": "X"}, headers=_auth(a)
    )
    assert self_e.status_code == 400


def test_mentor_reviews_and_leaderboard(client, db_session, admin_token):
    mentor_tok = _register(client, db_session, admin_token, "m@e.com", "Mentor M", "Data Science / AI")
    mentee_tok = _register(client, db_session, admin_token, "mt@e.com", "Mentee T", "Data Science / AI")

    client.post(
        "/api/v1/mentorship/mentors",
        json={"programs": "Rooman Data", "headline": "Lead DS", "hourly_rate": 2000},
        headers=_auth(mentor_tok),
    )
    mentor_id = client.get("/api/v1/mentorship/mentors", headers=_auth(mentee_tok)).json()[0]["id"]

    when = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    booking = client.post(
        "/api/v1/mentorship/sessions",
        json={"mentor_id": mentor_id, "scheduled_at": when, "duration_minutes": 60},
        headers=_auth(mentee_tok),
    )
    session_id = booking.json()["id"]

    # Complete then review
    done = client.post(
        f"/api/v1/mentorship/sessions/{session_id}/complete", headers=_auth(mentee_tok)
    )
    assert done.status_code == 200
    assert done.json()["status"] == "completed"

    review = client.post(
        "/api/v1/mentorship/reviews",
        json={"session_id": session_id, "rating": 5, "comment": "Brilliant"},
        headers=_auth(mentee_tok),
    )
    assert review.status_code == 201, review.text

    # Cannot review twice
    dup = client.post(
        "/api/v1/mentorship/reviews",
        json={"session_id": session_id, "rating": 4},
        headers=_auth(mentee_tok),
    )
    assert dup.status_code == 409

    # Mentor (not mentee) cannot review their own session
    not_mentee = client.post(
        "/api/v1/mentorship/reviews",
        json={"session_id": session_id, "rating": 1},
        headers=_auth(mentor_tok),
    )
    assert not_mentee.status_code in (403, 409)

    board = client.get("/api/v1/mentorship/leaderboard", headers=_auth(mentee_tok)).json()
    top = next(e for e in board if e["mentor_id"] == mentor_id)
    assert top["avg_rating"] == 5.0
    assert top["review_count"] == 1
    assert top["sessions_completed"] == 1


def test_group_discussion_feed(client, db_session, admin_token):
    a = _register(client, db_session, admin_token, "g_a@e.com", "Group A", "Cloud / DevOps")
    b = _register(client, db_session, admin_token, "g_b@e.com", "Group B", "Cloud / DevOps")

    comm = client.post(
        "/api/v1/community",
        json={"name": "SRE Circle", "slug": "sre-circle", "description": "SRE folks"},
        headers=_auth(a),
    )
    cid = comm.json()["id"]

    # Non-member cannot post
    blocked = client.post(
        f"/api/v1/community/{cid}/posts", json={"body": "hi"}, headers=_auth(b)
    )
    assert blocked.status_code == 403

    # Join then post
    client.post(f"/api/v1/community/{cid}/join", headers=_auth(b))
    posted = client.post(
        f"/api/v1/community/{cid}/posts",
        json={"body": "First discussion thread!"}, headers=_auth(b),
    )
    assert posted.status_code == 201, posted.text
    post_id = posted.json()["id"]

    feed = client.get(f"/api/v1/community/{cid}/posts", headers=_auth(a)).json()
    assert any(p["id"] == post_id for p in feed)

    # Author can delete their own post
    deleted = client.delete(
        f"/api/v1/community/{cid}/posts/{post_id}", headers=_auth(b)
    )
    assert deleted.status_code == 200


def test_spotlight_stories(client, db_session, admin_token):
    a = _register(client, db_session, admin_token, "s_a@e.com", "Star A", "Full-Stack Development")

    story = client.post(
        "/api/v1/spotlight",
        json={"title": "My journey", "story": "It was great.", "program_trained": "Rooman FS"},
        headers=_auth(a),
    )
    assert story.status_code == 201, story.text
    sid = story.json()["id"]
    assert story.json()["is_featured"] is False

    liked = client.post(f"/api/v1/spotlight/{sid}/like", headers=_auth(a))
    assert liked.json()["likes"] == 1

    # Non-admin cannot feature
    not_admin = client.post(f"/api/v1/spotlight/{sid}/feature", headers=_auth(a))
    assert not_admin.status_code == 403

    # Admin can feature
    feat = client.post(
        f"/api/v1/spotlight/{sid}/feature", headers=_auth(admin_token)
    )
    assert feat.status_code == 200
    assert feat.json()["is_featured"] is True

    featured = client.get(
        "/api/v1/spotlight", params={"featured_only": True}, headers=_auth(a)
    ).json()
    assert any(s["id"] == sid for s in featured)


def test_applications_and_referrals(client, db_session, admin_token):
    poster = _register(client, db_session, admin_token, "p@e.com", "Poster P", "Cloud / DevOps")
    applicant = _register(client, db_session, admin_token, "ap@e.com", "Applicant A", "Cloud / DevOps")
    referrer = _register(client, db_session, admin_token, "rf@e.com", "Referrer R", "Cloud / DevOps")
    candidate = _register(client, db_session, admin_token, "cd@e.com", "Candidate C", "Cloud / DevOps")

    opp = client.post(
        "/api/v1/opportunities",
        json={"kind": "hiring", "title": "DevOps Lead", "expertise_domain": "Cloud / DevOps"},
        headers=_auth(poster),
    )
    opp_id = opp.json()["id"]

    # Direct application
    app1 = client.post(
        f"/api/v1/opportunities/{opp_id}/apply",
        json={"note": "Keen!"}, headers=_auth(applicant),
    )
    assert app1.status_code == 201, app1.text

    # Cannot apply twice
    dup = client.post(
        f"/api/v1/opportunities/{opp_id}/apply", json={}, headers=_auth(applicant)
    )
    assert dup.status_code == 409

    # Author cannot apply to own post
    own = client.post(
        f"/api/v1/opportunities/{opp_id}/apply", json={}, headers=_auth(poster)
    )
    assert own.status_code == 400

    # Referral requires a connection
    cand_id, ref_id = _ids(client, referrer, "Candidate C", "Referrer R")
    no_conn = client.post(
        f"/api/v1/opportunities/{opp_id}/refer",
        json={"candidate_id": cand_id}, headers=_auth(referrer),
    )
    assert no_conn.status_code == 403

    _connect(client, referrer, candidate, cand_id, ref_id)
    referred = client.post(
        f"/api/v1/opportunities/{opp_id}/refer",
        json={"candidate_id": cand_id, "note": "Strong engineer"},
        headers=_auth(referrer),
    )
    assert referred.status_code == 201, referred.text
    assert referred.json()["referred_by"] == ref_id

    # Poster sees both in the pipeline
    apps = client.get(
        f"/api/v1/opportunities/{opp_id}/applications", headers=_auth(poster)
    ).json()
    assert len(apps) == 2

    # Non-owner cannot view applications
    forbidden = client.get(
        f"/api/v1/opportunities/{opp_id}/applications", headers=_auth(applicant)
    )
    assert forbidden.status_code == 403

    # Poster moves an application to "shortlisted"
    app_id = apps[0]["id"]
    upd = client.patch(
        f"/api/v1/opportunities/applications/{app_id}",
        json={"status": "shortlisted"}, headers=_auth(poster),
    )
    assert upd.status_code == 200
    assert upd.json()["status"] == "shortlisted"

    # Applicant sees their own applications
    mine = client.get(
        "/api/v1/opportunities/applications/mine", headers=_auth(applicant)
    ).json()
    assert any(a["opportunity_id"] == opp_id for a in mine)
