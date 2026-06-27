"""End-to-end flow test — exercises the full alumni journey across modules.

invite -> preview -> accept(register w/ details) -> login -> profile read/update
-> post + comment + like -> opportunity match notification -> become mentor
-> book paid session -> startupvarsity apply -> community join -> notifications.
"""
from datetime import datetime, timezone, timedelta

from app.models.invite import Invite


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _invite_and_accept(client, db_session, admin_token, email, name, domain):
    # Admin creates an invite
    res = client.post(
        "/api/v1/invites",
        json={"email": email, "full_name": name, "program_trained": "AWS Cloud"},
        headers=_auth(admin_token),
    )
    assert res.status_code == 201, res.text
    assert res.json()["status"] == "sent"

    # Token is delivered by email; fetch it from the DB for the test.
    invite = db_session.query(Invite).filter(Invite.email == email).one()
    token = invite.token

    # Public preview works without auth
    pre = client.get(f"/api/v1/invites/{token}")
    assert pre.status_code == 200, pre.text
    assert pre.json()["email"] == email
    assert "token" not in pre.json()  # no token leak

    # Accept with full registration details (req #3)
    acc = client.post(
        "/api/v1/invites/accept",
        json={
            "token": token,
            "password": "secret12",
            "full_name": name,
            "current_company": "Acme Corp",
            "current_title": "Engineer",
            "expertise_domain": domain,
            "skills": "AWS, Docker",
            "location": "Bengaluru",
            "open_to_mentoring": True,
            "open_to_opportunities": True,
        },
    )
    assert acc.status_code == 201, acc.text

    # Login as the new alumnus
    login = client.post(
        "/api/v1/auth/login", data={"username": email, "password": "secret12"}
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


def test_full_alumni_journey(client, db_session, admin_token):
    domain = "Cloud / DevOps"

    # ---- Two alumni register through invites ----
    tok_a = _invite_and_accept(
        client, db_session, admin_token, "asha@e2e.com", "Asha", domain
    )
    tok_b = _invite_and_accept(
        client, db_session, admin_token, "vikram@e2e.com", "Vikram", domain
    )

    # ---- Registration captured details (req #3) ----
    prof = client.get("/api/v1/profiles/me", headers=_auth(tok_a)).json()
    assert prof["current_company"] == "Acme Corp"
    assert prof["expertise_domain"] == domain
    assert prof["open_to_mentoring"] is True

    # ---- Profile update ----
    upd = client.put(
        "/api/v1/profiles/me",
        json={"headline": "Cloud nerd", "bio": "I like pipelines"},
        headers=_auth(tok_a),
    )
    assert upd.status_code == 200
    assert upd.json()["headline"] == "Cloud nerd"

    # ---- Feed: post, comment, like (req #4) ----
    post = client.post(
        "/api/v1/feed",
        json={"body": "Shipping a new feature!", "post_type": "doing"},
        headers=_auth(tok_a),
    )
    assert post.status_code == 201, post.text
    post_id = post.json()["id"]
    assert post.json()["author"]["full_name"] == "Asha"

    feed = client.get("/api/v1/feed", headers=_auth(tok_b)).json()
    assert any(p["id"] == post_id for p in feed)

    cmt = client.post(
        f"/api/v1/feed/{post_id}/comments",
        json={"body": "Nice work!"},
        headers=_auth(tok_b),
    )
    assert cmt.status_code == 201, cmt.text

    like = client.post(f"/api/v1/feed/{post_id}/like", headers=_auth(tok_b))
    assert like.status_code == 200
    assert like.json()["likes"] == 1
    assert len(like.json()["comments"]) == 1

    # ---- Opportunity matching (req #4a/#4b) ----
    # Asha posts a hiring need
    client.post(
        "/api/v1/opportunities",
        json={"kind": "hiring", "title": "Need a DevOps lead", "expertise_domain": domain},
        headers=_auth(tok_a),
    )
    # Vikram posts a seeking-role -> should notify Asha (counterpart, same domain)
    seek = client.post(
        "/api/v1/opportunities",
        json={"kind": "seeking", "title": "Looking for DevOps role", "expertise_domain": domain},
        headers=_auth(tok_b),
    )
    assert seek.status_code == 201, seek.text

    notes_a = client.get("/api/v1/notifications", headers=_auth(tok_a)).json()
    match_notes = [n for n in notes_a if n["type"] == "match"]
    assert match_notes, f"expected a match notification, got {notes_a}"

    # ---- Opportunity list filters ----
    hiring = client.get(
        "/api/v1/opportunities", params={"kind": "hiring"}, headers=_auth(tok_a)
    ).json()
    assert hiring and all(o["kind"] == "hiring" for o in hiring)

    # ---- Mentorship: Vikram becomes a mentor, Asha books a paid session (req #2b) ----
    mentor = client.post(
        "/api/v1/mentorship/mentors",
        json={"programs": "AWS Cloud", "headline": "Senior SRE", "hourly_rate": 2000},
        headers=_auth(tok_b),
    )
    assert mentor.status_code == 201, mentor.text
    mentor_id = mentor.json()["id"]

    when = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    booking = client.post(
        "/api/v1/mentorship/sessions",
        json={"mentor_id": mentor_id, "program": "AWS prep", "scheduled_at": when, "duration_minutes": 90},
        headers=_auth(tok_a),
    )
    assert booking.status_code == 201, booking.text
    # 2000/hr * 1.5h = 3000, payment pending
    assert booking.json()["amount"] == 3000.0
    assert booking.json()["payment_status"] == "pending"

    # Mentor (Vikram) is notified of the booking
    notes_b = client.get("/api/v1/notifications", headers=_auth(tok_b)).json()
    assert any(n["type"] == "mentorship" for n in notes_b)

    # ---- StartupVarsity apply (req #2c) ----
    sv = client.post(
        "/api/v1/startupvarsity",
        json={"name": "SkillBridge", "pitch": "Marketplace", "stage": "idea",
              "resources_requested": "GPU compute"},
        headers=_auth(tok_a),
    )
    assert sv.status_code == 201, sv.text
    # opting in flips the profile flag
    prof2 = client.get("/api/v1/profiles/me", headers=_auth(tok_a)).json()
    assert prof2["interested_in_startupvarsity"] is True

    # ---- Community join (req #2a) ----
    comm = client.post(
        "/api/v1/community",
        json={"name": "Cloud Guild", "slug": "cloud-guild", "description": "Cloud folks"},
        headers=_auth(tok_a),
    )
    assert comm.status_code == 201, comm.text
    cid = comm.json()["id"]
    joined = client.post(f"/api/v1/community/{cid}/join", headers=_auth(tok_b))
    assert joined.status_code == 200
    assert joined.json()["member_count"] == 1

    # ---- Notifications read-all ----
    client.post("/api/v1/notifications/read-all", headers=_auth(tok_a))
    unread = client.get(
        "/api/v1/notifications", params={"unread_only": True}, headers=_auth(tok_a)
    ).json()
    assert unread == []


def test_connect_and_discuss(client, db_session, admin_token):
    """Engagement: discover -> connect -> accept -> message thread."""
    tok_a = _invite_and_accept(
        client, db_session, admin_token, "maya@e2e.com", "Maya", "Frontend Development"
    )
    tok_b = _invite_and_accept(
        client, db_session, admin_token, "raj@e2e.com", "Raj", "Frontend Development"
    )

    # Figure out user ids via the directory (list profiles)
    profiles = client.get("/api/v1/profiles", headers=_auth(tok_a)).json()
    raj = next(p for p in profiles if p["user"]["full_name"] == "Raj")
    raj_id = raj["user"]["id"]
    maya = next(p for p in profiles if p["user"]["full_name"] == "Maya")
    maya_id = maya["user"]["id"]

    # Initially not connected
    st = client.get(f"/api/v1/connections/status/{raj_id}", headers=_auth(tok_a)).json()
    assert st["state"] == "none"

    # Cannot message before connecting
    early = client.post(
        f"/api/v1/messages/{raj_id}", json={"body": "hi"}, headers=_auth(tok_a)
    )
    assert early.status_code == 403

    # Maya sends a connection request to Raj
    req = client.post(f"/api/v1/connections/{raj_id}", headers=_auth(tok_a))
    assert req.status_code == 201, req.text
    assert req.json()["state"] == "pending_outgoing"

    # Raj sees it as a pending incoming request + a notification
    pending = client.get("/api/v1/connections/pending", headers=_auth(tok_b)).json()
    assert len(pending) == 1
    conn_id = pending[0]["connection_id"]
    notes = client.get("/api/v1/notifications", headers=_auth(tok_b)).json()
    assert any(n["type"] == "connection" for n in notes)

    # Status is symmetric: Raj sees pending_incoming
    st_b = client.get(f"/api/v1/connections/status/{maya_id}", headers=_auth(tok_b)).json()
    assert st_b["state"] == "pending_incoming"

    # Raj accepts
    acc = client.post(f"/api/v1/connections/{conn_id}/accept", headers=_auth(tok_b))
    assert acc.status_code == 200
    assert acc.json()["state"] == "connected"

    # Both now list each other as a connection
    a_conns = client.get("/api/v1/connections", headers=_auth(tok_a)).json()
    assert any(c["user"]["full_name"] == "Raj" for c in a_conns)

    # Now they can message
    m1 = client.post(
        f"/api/v1/messages/{raj_id}", json={"body": "Hi Raj, loved your work!"},
        headers=_auth(tok_a),
    )
    assert m1.status_code == 201, m1.text
    m2 = client.post(
        f"/api/v1/messages/{maya_id}", json={"body": "Thanks Maya! Let's collaborate."},
        headers=_auth(tok_b),
    )
    assert m2.status_code == 201

    # Raj's inbox shows the conversation
    inbox = client.get("/api/v1/messages", headers=_auth(tok_b)).json()
    assert len(inbox) == 1
    assert inbox[0]["peer"]["full_name"] == "Maya"

    # Thread is ordered and marks incoming read
    thread = client.get(f"/api/v1/messages/{raj_id}", headers=_auth(tok_a)).json()
    assert [m["body"] for m in thread] == [
        "Hi Raj, loved your work!",
        "Thanks Maya! Let's collaborate.",
    ]
    # After reading, Maya has no unread from Raj
    inbox_a = client.get("/api/v1/messages", headers=_auth(tok_a)).json()
    assert inbox_a[0]["unread"] == 0


def test_mutual_request_auto_accepts(client, db_session, admin_token):
    tok_a = _invite_and_accept(
        client, db_session, admin_token, "sam@e2e.com", "Sam", "QA / Testing"
    )
    tok_b = _invite_and_accept(
        client, db_session, admin_token, "lee@e2e.com", "Lee", "QA / Testing"
    )
    profiles = client.get("/api/v1/profiles", headers=_auth(tok_a)).json()
    lee_id = next(p for p in profiles if p["user"]["full_name"] == "Lee")["user"]["id"]
    sam_id = next(p for p in profiles if p["user"]["full_name"] == "Sam")["user"]["id"]

    # Sam requests Lee
    client.post(f"/api/v1/connections/{lee_id}", headers=_auth(tok_a))
    # Lee independently requests Sam -> should auto-accept the existing request
    res = client.post(f"/api/v1/connections/{sam_id}", headers=_auth(tok_b))
    assert res.json()["state"] == "connected"


def test_security_guards(client, db_session, admin_token):
    # Non-admin cannot create invites
    tok = _invite_and_accept(
        client, db_session, admin_token, "guard@e2e.com", "Guard", "Cybersecurity"
    )
    res = client.post(
        "/api/v1/invites", json={"email": "x@e2e.com"}, headers=_auth(tok)
    )
    assert res.status_code == 403

    # Unauthenticated cannot read the feed
    assert client.get("/api/v1/feed").status_code == 401

    # Cannot accept the same invite twice
    invite = db_session.query(Invite).filter(Invite.email == "guard@e2e.com").one()
    again = client.post(
        "/api/v1/invites/accept",
        json={"token": invite.token, "password": "secret12", "full_name": "Guard"},
    )
    assert again.status_code == 409

    # Cannot book yourself as a mentor
    client.post(
        "/api/v1/mentorship/mentors",
        json={"hourly_rate": 1000}, headers=_auth(tok),
    )
    mentors = client.get("/api/v1/mentorship/mentors", headers=_auth(tok)).json()
    my_mentor_id = mentors[0]["id"]
    when = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    self_book = client.post(
        "/api/v1/mentorship/sessions",
        json={"mentor_id": my_mentor_id, "scheduled_at": when, "duration_minutes": 60},
        headers=_auth(tok),
    )
    assert self_book.status_code == 400
