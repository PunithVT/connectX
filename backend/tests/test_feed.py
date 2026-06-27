"""Feed + opportunity matching tests."""


def _alum_token(client, db_session, email="feed@test.com"):
    from app.crud.user import user_crud

    user_crud.create_user(
        db_session, email=email, password="pw12345", full_name="Feed User"
    )
    return client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "pw12345"},
    ).json()["access_token"]


def test_create_and_list_post(client, db_session):
    token = _alum_token(client, db_session)
    h = {"Authorization": f"Bearer {token}"}

    res = client.post(
        "/api/v1/feed", json={"body": "Hello alumni!", "post_type": "update"}, headers=h
    )
    assert res.status_code == 201, res.text
    post_id = res.json()["id"]

    feed = client.get("/api/v1/feed", headers=h).json()
    assert any(p["id"] == post_id for p in feed)

    # comment
    c = client.post(
        f"/api/v1/feed/{post_id}/comments", json={"body": "Nice!"}, headers=h
    )
    assert c.status_code == 201


def test_opportunity_matching_notifies(client, db_session):
    from app.crud.user import user_crud

    # hiring author
    user_crud.create_user(
        db_session, email="hire@test.com", password="pw12345", full_name="Hiring Mgr"
    )
    hire_token = client.post(
        "/api/v1/auth/login",
        data={"username": "hire@test.com", "password": "pw12345"},
    ).json()["access_token"]

    seek_token = _alum_token(client, db_session, email="seek@test.com")

    # seeker posts first
    client.post(
        "/api/v1/opportunities",
        json={"kind": "seeking", "title": "Seeking DevOps role",
              "expertise_domain": "Cloud / DevOps"},
        headers={"Authorization": f"Bearer {seek_token}"},
    )
    # hiring post in same domain should notify the seeker
    res = client.post(
        "/api/v1/opportunities",
        json={"kind": "hiring", "title": "Hiring DevOps",
              "expertise_domain": "Cloud / DevOps"},
        headers={"Authorization": f"Bearer {hire_token}"},
    )
    assert res.status_code == 201, res.text

    notes = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {seek_token}"},
    ).json()
    assert any(n["type"] == "match" for n in notes)
