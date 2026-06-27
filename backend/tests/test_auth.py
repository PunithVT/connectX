"""Auth flow tests."""
from app.crud.user import user_crud


def test_login_and_me(client, db_session):
    user_crud.create_user(
        db_session, email="a@test.com", password="secret12", full_name="Alum A"
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "a@test.com", "password": "secret12"},
    )
    assert res.status_code == 200
    token = res.json()["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "a@test.com"


def test_login_bad_password(client, db_session):
    user_crud.create_user(
        db_session, email="b@test.com", password="secret12", full_name="Alum B"
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": "b@test.com", "password": "wrong"},
    )
    assert res.status_code == 401


def test_protected_requires_token(client):
    assert client.get("/api/v1/feed").status_code == 401
