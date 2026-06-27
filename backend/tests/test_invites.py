"""Invite create → preview → accept flow."""


def test_invite_create_and_list(client, admin_token):
    res = client.post(
        "/api/v1/invites",
        json={"email": "grad@test.com", "full_name": "Grad", "program_trained": "Java"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 201, res.text
    assert res.json()["status"] == "sent"

    listing = client.get(
        "/api/v1/invites", headers={"Authorization": f"Bearer {admin_token}"}
    ).json()
    assert any(i["email"] == "grad@test.com" for i in listing)


def test_invite_requires_admin(client, db_session):
    from app.crud.user import user_crud

    user_crud.create_user(
        db_session, email="plain@test.com", password="pw12345", full_name="Plain"
    )
    token = client.post(
        "/api/v1/auth/login",
        data={"username": "plain@test.com", "password": "pw12345"},
    ).json()["access_token"]
    res = client.post(
        "/api/v1/invites",
        json={"email": "x@test.com"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


def test_invite_accept_creates_user(client, admin_token, db_session):
    client.post(
        "/api/v1/invites",
        json={"email": "grad2@test.com", "full_name": "Grad Two"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    from app.crud.invite import invite_crud

    invite = invite_crud.get_by_email(db_session, "grad2@test.com")
    assert invite is not None

    res = client.post(
        "/api/v1/invites/accept",
        json={
            "token": invite.token,
            "password": "newpass12",
            "full_name": "Grad Two",
            "current_company": "Acme",
            "expertise_domain": "Cloud / DevOps",
            "open_to_mentoring": True,
        },
    )
    assert res.status_code == 201, res.text
    assert res.json()["email"] == "grad2@test.com"

    # New user can log in
    login = client.post(
        "/api/v1/auth/login",
        data={"username": "grad2@test.com", "password": "newpass12"},
    )
    assert login.status_code == 200
