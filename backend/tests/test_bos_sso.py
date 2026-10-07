"""Sign in with BOS (OIDC) tests: a fake provider with real RSA-signed tokens."""
import base64
import hashlib
import time
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from joserfc import jwt as oidc_jwt
from joserfc.jwk import RSAKey

from app.core.config import settings
from app.core.security import create_access_token, decode_token
from app.crud.user import user_crud
from app.models.alumni_profile import AlumniProfile
from app.models.user import User
from app.services import bos_sso

ISSUER = "http://identity.test/realms/bos"
CLIENT_ID = "connectx"
REDIRECT_URI = "http://testserver/api/v1/auth/bos/callback"
TENANT = "6c1f2b8e-0000-4000-8000-000000000001"
BASE = "/api/v1/auth/bos"

METADATA = {
    "issuer": ISSUER,
    "authorization_endpoint": f"{ISSUER}/protocol/openid-connect/auth",
    "token_endpoint": f"{ISSUER}/protocol/openid-connect/token",
    "jwks_uri": f"{ISSUER}/protocol/openid-connect/certs",
}


def _rsa(kid: str) -> RSAKey:
    return RSAKey.generate_key(2048, parameters={"kid": kid, "use": "sig", "alg": "RS256"})


KEY = _rsa("k1")
ROTATED_KEY = _rsa("k2")
ROGUE_KEY = _rsa("k1")  # same kid as KEY, different key material
# Keycloak also publishes an encryption key in its JWKS; it must not break anything.
ENC_KEY = RSAKey.generate_key(
    2048, parameters={"kid": "enc1", "use": "enc", "alg": "RSA-OAEP"}
)


class FakeProvider:
    """Stands in for Keycloak: discovery, JWKS and the token endpoint."""

    def __init__(self):
        self.keys = [KEY, ENC_KEY]
        self.signing_key = KEY
        self.id_claims: dict = {}
        self.access_claims: dict = {}
        self.token_status = 200
        self.token_requests: list[dict] = []
        self.jwks_fetches = 0
        self.nonce: str | None = None

    def sign(self, claims: dict, key: RSAKey | None = None) -> str:
        key = key or self.signing_key
        return oidc_jwt.encode({"alg": "RS256", "kid": key.kid}, claims, key)

    def get_json(self, url: str) -> dict:
        if url == f"{ISSUER}/.well-known/openid-configuration":
            return dict(METADATA)
        if url == METADATA["jwks_uri"]:
            self.jwks_fetches += 1
            return {"keys": [k.as_dict(private=False) for k in self.keys]}
        raise AssertionError(f"unexpected GET {url}")

    def post_form(self, url: str, data: dict) -> httpx.Response:
        assert url == METADATA["token_endpoint"]
        self.token_requests.append(data)
        if self.token_status != 200:
            return httpx.Response(self.token_status, json={"error": "invalid_grant"})
        now = int(time.time())
        id_claims = {
            "iss": ISSUER,
            "aud": CLIENT_ID,
            "azp": CLIENT_ID,
            "sub": "kc-user-1",
            "iat": now,
            "exp": now + 300,
            "nonce": self.nonce,
            "email": "asha@example.com",
            "email_verified": True,
            "name": "Asha Rao",
            "bos_tenant_id": TENANT,
            **self.id_claims,
        }
        access_claims = {
            "iss": ISSUER,
            "aud": "account",
            "azp": CLIENT_ID,
            "sub": "kc-user-1",
            "iat": now,
            "exp": now + 300,
            "typ": "Bearer",
            "bos_tenant_id": TENANT,
            **self.access_claims,
        }
        id_claims = {k: v for k, v in id_claims.items() if v is not None}
        return httpx.Response(
            200,
            json={
                "access_token": self.sign(access_claims),
                "id_token": self.sign(id_claims),
                "token_type": "Bearer",
                "expires_in": 300,
            },
        )


@pytest.fixture()
def provider(monkeypatch):
    fake = FakeProvider()
    monkeypatch.setattr(bos_sso, "_get_json", fake.get_json)
    monkeypatch.setattr(bos_sso, "_post_form", fake.post_form)
    bos_sso.reset_caches()
    yield fake
    bos_sso.reset_caches()


@pytest.fixture()
def sso_on(monkeypatch, provider):
    monkeypatch.setattr(settings, "BOS_SSO_ENABLED", True)
    monkeypatch.setattr(settings, "BOS_OIDC_ISSUER", ISSUER)
    monkeypatch.setattr(settings, "BOS_OIDC_CLIENT_ID", CLIENT_ID)
    monkeypatch.setattr(settings, "BOS_OIDC_CLIENT_SECRET", "s3cret")
    monkeypatch.setattr(settings, "BOS_OIDC_REDIRECT_URI", REDIRECT_URI)
    monkeypatch.setattr(settings, "BOS_TENANT_ID", TENANT)
    monkeypatch.setattr(settings, "FRONTEND_BASE_URL", "http://spa.test")
    return provider


def _start(client, provider, next_path: str | None = None):
    url = f"{BASE}/login" + (f"?next={next_path}" if next_path else "")
    res = client.get(url, follow_redirects=False)
    assert res.status_code == 302
    query = parse_qs(urlparse(res.headers["location"]).query)
    provider.nonce = query["nonce"][0]
    return res, query


def _sign_in(client, provider, next_path: str | None = None):
    """Run login + callback; return the final redirect Location."""
    _, query = _start(client, provider, next_path)
    res = client.get(
        f"{BASE}/callback",
        params={"code": "auth-code-1", "state": query["state"][0]},
        follow_redirects=False,
    )
    assert res.status_code == 302
    return res.headers["location"]


def _fragment(location: str) -> dict:
    return {k: v[0] for k, v in parse_qs(urlparse(location).fragment).items()}


def _error(location: str) -> str | None:
    parsed = urlparse(location)
    assert parsed.path == "/login", location
    return parse_qs(parsed.query).get("sso_error", [None])[0]


# --- off by default --------------------------------------------------------

def test_off_by_default(client, monkeypatch):
    from app.core.config import Settings

    assert Settings.model_fields["BOS_SSO_ENABLED"].default is False
    monkeypatch.setattr(settings, "BOS_SSO_ENABLED", False)  # ignore any local .env
    assert client.get(f"{BASE}/config").json() == {"enabled": False}
    assert client.get(f"{BASE}/login", follow_redirects=False).status_code == 404
    assert client.get(f"{BASE}/callback?code=x&state=y").status_code == 404
    assert client.post(f"{BASE}/exchange", json={"code": "x"}).status_code == 404


def test_switched_on_but_incomplete_stays_off(client, sso_on, monkeypatch):
    monkeypatch.setattr(settings, "BOS_OIDC_CLIENT_SECRET", "")
    assert bos_sso.missing_settings() == ["BOS_OIDC_CLIENT_SECRET"]
    assert client.get(f"{BASE}/config").json() == {"enabled": False}
    assert client.get(f"{BASE}/login", follow_redirects=False).status_code == 404


def test_password_login_still_works_with_sso_on(client, db_session, sso_on):
    user_crud.create_user(
        db_session, email="pw@test.com", password="secret12", full_name="PW"
    )
    res = client.post(
        "/api/v1/auth/login", data={"username": "pw@test.com", "password": "secret12"}
    )
    assert res.status_code == 200


# --- login redirect ----------------------------------------------------------

def test_login_redirects_with_pkce_state_and_nonce(client, sso_on):
    assert client.get(f"{BASE}/config").json() == {"enabled": True}
    res, query = _start(client, sso_on, "/events")
    location = res.headers["location"]
    assert location.startswith(METADATA["authorization_endpoint"] + "?")
    assert query["client_id"] == [CLIENT_ID]
    assert query["redirect_uri"] == [REDIRECT_URI]
    assert query["response_type"] == ["code"]
    assert query["scope"] == ["openid email profile"]
    assert query["code_challenge_method"] == ["S256"]

    cookie = res.headers["set-cookie"]
    assert bos_sso.FLOW_COOKIE in cookie
    assert "HttpOnly" in cookie and "Path=/api/v1/auth/bos/callback" in cookie
    assert "samesite=lax" in cookie.lower()

    flow = bos_sso._unsign(res.cookies[bos_sso.FLOW_COOKIE])
    assert flow["state"] == query["state"][0]
    assert flow["nonce"] == query["nonce"][0]
    assert flow["next"] == "/events"
    expected = base64.urlsafe_b64encode(
        hashlib.sha256(flow["verifier"].encode()).digest()
    ).rstrip(b"=").decode()
    assert query["code_challenge"] == [expected]


def test_login_with_unreachable_provider_returns_to_login(client, sso_on, monkeypatch):
    def down(url):
        raise bos_sso.SignInRefused("provider_unavailable", "down")

    monkeypatch.setattr(bos_sso, "_get_json", down)
    res = client.get(f"{BASE}/login", follow_redirects=False)
    assert res.status_code == 302
    assert _error(res.headers["location"]) == "provider_unavailable"


# --- happy paths -------------------------------------------------------------

def test_existing_user_signs_in_and_keeps_role(client, db_session, sso_on):
    user = user_crud.create_user(
        db_session, email="Asha@Example.com", password="pw12345",
        full_name="Asha", role="admin",
    )
    location = _sign_in(client, sso_on, "/events")
    parsed = urlparse(location)
    assert f"{parsed.scheme}://{parsed.netloc}{parsed.path}" == (
        "http://spa.test/auth/bos/complete"
    )
    fragment = _fragment(location)
    assert fragment["next"] == "/events"

    # the code was exchanged with the secret and the PKCE verifier
    sent = sso_on.token_requests[0]
    assert sent["code"] == "auth-code-1"
    assert sent["client_secret"] == "s3cret"
    assert sent["redirect_uri"] == REDIRECT_URI
    assert len(sent["code_verifier"]) >= 43

    res = client.post(f"{BASE}/exchange", json={"code": fragment["code"]})
    assert res.status_code == 200
    tokens = res.json()
    assert decode_token(tokens["access_token"])["type"] == "access"
    assert decode_token(tokens["refresh_token"])["type"] == "refresh"

    me = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert me.status_code == 200
    assert me.json()["id"] == user.id
    assert me.json()["role"] == "admin"
    assert db_session.query(User).count() == 1


def test_new_user_from_linked_tenant_is_provisioned_as_alumnus(
    client, db_session, sso_on
):
    location = _sign_in(client, sso_on)
    fragment = _fragment(location)
    assert "next" not in fragment

    user = db_session.query(User).filter_by(email="asha@example.com").one()
    assert user.role == "alumnus"
    assert user.full_name == "Asha Rao"
    assert user.is_active
    assert db_session.query(AlumniProfile).filter_by(user_id=user.id).count() == 1

    res = client.post(f"{BASE}/exchange", json={"code": fragment["code"]})
    assert res.status_code == 200
    assert decode_token(res.json()["access_token"])["sub"] == str(user.id)


def test_key_rotation_refetches_jwks(client, db_session, sso_on):
    user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    bos_sso.get_key_set()  # cache holds only k1
    assert sso_on.jwks_fetches == 1
    sso_on.keys = [ROTATED_KEY]
    sso_on.signing_key = ROTATED_KEY
    location = _sign_in(client, sso_on)
    assert "code" in _fragment(location)
    assert sso_on.jwks_fetches == 2


# --- refusals ------------------------------------------------------------------

def test_new_user_from_other_tenant_is_refused(client, db_session, sso_on):
    sso_on.id_claims = {"bos_tenant_id": "another-tenant"}
    sso_on.access_claims = {"bos_tenant_id": "another-tenant"}
    assert _error(_sign_in(client, sso_on)) == "no_account"
    assert db_session.query(User).count() == 0


def test_no_jit_when_deployment_has_no_tenant(client, db_session, sso_on, monkeypatch):
    monkeypatch.setattr(settings, "BOS_TENANT_ID", "")
    assert _error(_sign_in(client, sso_on)) == "no_account"
    assert db_session.query(User).count() == 0


def test_new_user_with_address_connectx_rejects_is_refused(client, db_session, sso_on):
    # e.g. a reserved domain: UserOut.email (EmailStr) could not serialize this account
    sso_on.id_claims = {"email": "alum@campus.local"}
    assert _error(_sign_in(client, sso_on)) == "email_unsupported"
    assert db_session.query(User).count() == 0


def test_unverified_email_is_refused(client, db_session, sso_on):
    user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    sso_on.id_claims = {"email_verified": False}
    assert _error(_sign_in(client, sso_on)) == "email_unverified"


def test_missing_email_is_refused(client, sso_on):
    sso_on.id_claims = {"email": None}
    assert _error(_sign_in(client, sso_on)) == "email_missing"


def test_deactivated_user_is_refused(client, db_session, sso_on):
    user = user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    user.is_active = False
    db_session.commit()
    assert _error(_sign_in(client, sso_on)) == "account_disabled"


@pytest.mark.parametrize(
    "id_claims",
    [
        {"iss": "http://evil.test/realms/bos"},
        {"aud": "another-client", "azp": "another-client"},
        {"azp": "another-client"},
        {"exp": int(time.time()) - 3600, "iat": int(time.time()) - 7200},
        {"nonce": "not-the-nonce"},
    ],
    ids=["issuer", "audience", "azp", "expired", "nonce"],
)
def test_bad_id_token_is_refused(client, db_session, sso_on, id_claims):
    user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    sso_on.id_claims = id_claims
    assert _error(_sign_in(client, sso_on)) == "invalid_token"


@pytest.mark.parametrize(
    "access_claims",
    [
        {"iss": "http://evil.test/realms/bos"},
        {"aud": "account", "azp": "another-client"},
        {"exp": int(time.time()) - 3600, "iat": int(time.time()) - 7200},
        {"sub": "someone-else"},
    ],
    ids=["issuer", "client", "expired", "subject"],
)
def test_bad_access_token_is_refused(client, db_session, sso_on, access_claims):
    user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    sso_on.access_claims = access_claims
    assert _error(_sign_in(client, sso_on)) == "invalid_token"


def test_token_signed_by_unknown_key_is_refused(client, db_session, sso_on):
    user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    sso_on.signing_key = ROGUE_KEY  # kid "k1" but not the published key
    assert _error(_sign_in(client, sso_on)) == "invalid_token"


def test_hmac_token_is_refused(sso_on):
    from jose import jwt as jose_jwt

    forged = jose_jwt.encode(
        {"iss": ISSUER, "aud": CLIENT_ID, "sub": "x", "exp": int(time.time()) + 60},
        "anything",
        algorithm="HS256",
    )
    with pytest.raises(bos_sso.SignInRefused) as exc:
        bos_sso.verify_tokens({"id_token": forged, "access_token": forged}, nonce="n")
    assert exc.value.code == "invalid_token"


def test_state_mismatch_is_refused_before_code_exchange(client, sso_on):
    _start(client, sso_on)
    res = client.get(
        f"{BASE}/callback",
        params={"code": "auth-code-1", "state": "forged"},
        follow_redirects=False,
    )
    assert _error(res.headers["location"]) == "invalid_state"
    assert sso_on.token_requests == []


def test_callback_without_flow_cookie_is_refused(client, sso_on):
    res = client.get(
        f"{BASE}/callback",
        params={"code": "auth-code-1", "state": "anything"},
        follow_redirects=False,
    )
    assert _error(res.headers["location"]) == "invalid_state"
    assert sso_on.token_requests == []


def test_rejected_code_is_refused(client, sso_on):
    sso_on.token_status = 400
    assert _error(_sign_in(client, sso_on)) == "code_rejected"


@pytest.mark.parametrize(
    "error,reason", [("access_denied", "cancelled"), ("server_error", "provider_error")]
)
def test_provider_error_is_reported(client, sso_on, error, reason):
    _, query = _start(client, sso_on)
    res = client.get(
        f"{BASE}/callback",
        params={"error": error, "state": query["state"][0]},
        follow_redirects=False,
    )
    assert _error(res.headers["location"]) == reason
    assert sso_on.token_requests == []


# --- one-time code -------------------------------------------------------------

def test_handoff_code_works_once(client, db_session, sso_on):
    user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    code = _fragment(_sign_in(client, sso_on))["code"]
    assert client.post(f"{BASE}/exchange", json={"code": code}).status_code == 200
    assert client.post(f"{BASE}/exchange", json={"code": code}).status_code == 401


def test_exchange_rejects_garbage_and_other_token_types(client, db_session, sso_on):
    user = user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    assert client.post(f"{BASE}/exchange", json={"code": "garbage"}).status_code == 401
    access = create_access_token(user.id)
    assert client.post(f"{BASE}/exchange", json={"code": access}).status_code == 401


def test_handoff_code_is_not_an_access_token(client, db_session, sso_on):
    user = user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    code = bos_sso.issue_handoff(user.id)
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {code}"})
    assert res.status_code == 401


def test_exchange_refuses_user_deactivated_meanwhile(client, db_session, sso_on):
    user = user_crud.create_user(
        db_session, email="asha@example.com", password="pw12345", full_name="Asha"
    )
    code = bos_sso.issue_handoff(user.id)
    user.is_active = False
    db_session.commit()
    assert client.post(f"{BASE}/exchange", json={"code": code}).status_code == 401


# --- helpers ---------------------------------------------------------------------

@pytest.mark.parametrize(
    "raw,expected",
    [
        ("/events", "/events"),
        ("/profile/3?tab=a", "/profile/3?tab=a"),
        ("", ""),
        ("events", ""),
        ("//evil.test", ""),
        ("/\\evil.test", ""),
        ("https://evil.test", ""),
        ("/login", ""),
        ("/auth/bos/complete", ""),
        ("/x\n", ""),
        (None, ""),
    ],
)
def test_safe_next(raw, expected):
    assert bos_sso.safe_next(raw) == expected


def test_discovery_issuer_mismatch_is_refused(sso_on, monkeypatch):
    monkeypatch.setattr(
        bos_sso, "_get_json", lambda url: {**METADATA, "issuer": "http://evil.test"}
    )
    with pytest.raises(bos_sso.SignInRefused) as exc:
        bos_sso.get_metadata()
    assert exc.value.code == "provider_unavailable"
