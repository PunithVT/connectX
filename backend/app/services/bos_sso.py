"""Sign in with BOS: OpenID Connect against the BOS identity provider (Keycloak).

Off unless ``BOS_SSO_ENABLED`` is true and the four ``BOS_OIDC_*`` settings are set
(``app/core/config.py``). Email + password sign-in does not depend on any of this.

The flow is the confidential authorization-code flow, with PKCE on top:

1. ``GET /api/v1/auth/bos/login`` redirects the browser to the provider. ``state``,
   ``nonce`` and the PKCE verifier travel in a short-lived, signed, HttpOnly cookie, so
   nothing the provider sends back can choose them.
2. The provider redirects to ``GET /api/v1/auth/bos/callback?code=...&state=...``. The
   code is exchanged here with the client secret, which never reaches the browser. The ID
   token is verified against the provider's published keys (JWKS): signature, ``iss``,
   ``aud``, ``azp``, ``exp`` and ``nonce``. The access token is verified the same way for
   ``iss``, ``aud``/``azp`` and ``exp``.
3. The person is mapped to a connectX user (``resolve_user``) and the browser goes to the
   SPA at ``FRONTEND_BASE_URL/auth/bos/complete#code=...`` carrying a one-time code, not
   tokens: a token in a URL outlives the visit in browser history.
4. The SPA posts that code to ``POST /api/v1/auth/bos/exchange`` and gets back exactly
   what password sign-in returns, the same access + refresh JWTs. ``get_current_user``
   and every role guard work unchanged.

Who gets in (BOS contract, section 1):

- The ID token must carry an ``email`` with ``email_verified`` true. The address is the
  join key between BOS products, so an unverified one is refused.
- An existing account with that address (case-insensitively) signs in as itself. Its role
  is not touched; roles are decided in connectX by its admins.
- Otherwise, if the token's ``bos_tenant_id`` equals ``BOS_TENANT_ID`` (connectX has no
  organization table, so the deployment itself is the tenant), an account is created just
  in time with the lowest role, ``alumnus``, plus an empty alumni profile, provided the
  address passes connectX's own email validation.
- Anything else is refused.
"""
from __future__ import annotations

import base64
import hashlib
import logging
import secrets
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode, urlparse

import httpx
from jose import JWTError
from jose import jwt as app_jwt
from joserfc import jwt as oidc_jwt
from joserfc.errors import InvalidKeyIdError, JoseError
from joserfc.jwk import KeySet
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.roles import DEFAULT_ROLE
from app.core.security import hash_password
from app.models.alumni_profile import AlumniProfile
from app.models.user import User

logger = logging.getLogger(__name__)

#: All must be set for SSO to switch on. Same names in every BOS product.
REQUIRED_SETTINGS = (
    "BOS_OIDC_ISSUER",
    "BOS_OIDC_CLIENT_ID",
    "BOS_OIDC_CLIENT_SECRET",
    "BOS_OIDC_REDIRECT_URI",
)

#: ``bos_tenant_id`` arrives through a default client scope on every BOS product client,
#: so it is not requested here; asking for a scope the client lacks fails the sign-in.
SCOPE = "openid email profile"

#: Asymmetric only. The provider signs with its private key and publishes the public
#: half; accepting an HMAC algorithm would let anyone holding the public key mint tokens.
SIGNING_ALGORITHMS = [
    "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512",
]

#: Clock skew tolerated on ``exp`` / ``iat`` / ``nbf``, in seconds.
LEEWAY_SECONDS = 60

#: Seconds before a call to the provider is abandoned.
HTTP_TIMEOUT_SECONDS = 10

#: How long the discovery document and signing keys are reused. A key id the cache does
#: not know (a key rotation) forces a refetch regardless.
METADATA_TTL_SECONDS = 3600

#: Cookie carrying state / nonce / PKCE verifier between /login and /callback.
FLOW_COOKIE = "cx_bos_flow"
FLOW_SECONDS = 600

#: Lifetime of the one-time code the SPA redeems at /exchange.
HANDOFF_SECONDS = 60

_FLOW_TYPE = "bos_flow"
_HANDOFF_TYPE = "bos_handoff"

#: ``users.email`` / ``users.full_name`` are VARCHAR(255).
_MAX_LEN = 255

#: The address check connectX's own schemas (``UserOut.email``) apply. A new account
#: whose address fails it could not even be returned by ``/auth/me``.
_EMAIL = TypeAdapter(EmailStr)


class SignInRefused(Exception):
    """A sign-in refused for a stated reason.

    ``code`` travels to the login page as ``?sso_error=`` and picks the message shown
    there, so it names a cause and never echoes anything the provider sent.
    """

    def __init__(self, code: str, detail: str = ""):
        super().__init__(detail or code)
        self.code = code
        self.detail = detail or code


@dataclass(frozen=True)
class BosIdentity:
    """The verified person behind a BOS sign-in."""

    subject: str
    email: str
    name: str
    tenant_id: str | None


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

def missing_settings() -> list[str]:
    return [
        name for name in REQUIRED_SETTINGS
        if not str(getattr(settings, name, "") or "").strip()
    ]


def is_enabled() -> bool:
    """On only when switched on AND fully configured, never half-enabled."""
    return bool(settings.BOS_SSO_ENABLED) and not missing_settings()


def issuer() -> str:
    return settings.BOS_OIDC_ISSUER.strip().rstrip("/")


def cookie_path() -> str:
    """The flow cookie is only needed by the callback, so scope it to that path."""
    return urlparse(settings.BOS_OIDC_REDIRECT_URI).path or "/"


def cookie_secure() -> bool:
    return settings.BOS_OIDC_REDIRECT_URI.lower().startswith("https://")


def frontend_url(
    path: str, query: dict[str, str] | None = None, fragment: dict[str, str] | None = None
) -> str:
    url = settings.FRONTEND_BASE_URL.rstrip("/") + path
    if query:
        url += "?" + urlencode(query)
    if fragment:
        url += "#" + urlencode(fragment)
    return url


def safe_next(raw: Any) -> str:
    """An in-app path to return to after sign-in, or '' (the SPA then goes to /)."""
    if not isinstance(raw, str) or len(raw) > 512:
        return ""
    if not raw.startswith("/") or raw.startswith("//") or "\\" in raw:
        return ""
    if any(ord(ch) < 32 for ch in raw):
        return ""
    if raw.startswith(("/login", "/auth/bos")):
        return ""
    return raw


# ---------------------------------------------------------------------------
# Signed short-lived values (flow cookie, handoff code), keyed by JWT_SECRET
# ---------------------------------------------------------------------------

def _sign(payload: dict[str, Any], seconds: int) -> str:
    now = datetime.now(timezone.utc)
    claims = {**payload, "iat": now, "exp": now + timedelta(seconds=seconds)}
    return app_jwt.encode(claims, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def _unsign(value: str) -> dict[str, Any]:
    return app_jwt.decode(value, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


# ---------------------------------------------------------------------------
# The provider: discovery, keys, code exchange
# ---------------------------------------------------------------------------

_cache_lock = threading.Lock()
_metadata_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_jwks_cache: dict[str, tuple[float, KeySet]] = {}


def reset_caches() -> None:
    """For tests, and for anything that changes the provider at runtime."""
    with _cache_lock:
        _metadata_cache.clear()
        _jwks_cache.clear()


def _get_json(url: str) -> dict[str, Any]:
    try:
        res = httpx.get(
            url, timeout=HTTP_TIMEOUT_SECONDS, headers={"Accept": "application/json"}
        )
        res.raise_for_status()
        data = res.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise SignInRefused("provider_unavailable", f"GET {url} failed: {exc}") from exc
    if not isinstance(data, dict):
        raise SignInRefused("provider_unavailable", f"GET {url} did not return an object")
    return data


def _post_form(url: str, data: dict[str, str]) -> httpx.Response:
    try:
        return httpx.post(
            url,
            data=data,
            timeout=HTTP_TIMEOUT_SECONDS,
            headers={"Accept": "application/json"},
        )
    except httpx.HTTPError as exc:
        raise SignInRefused("provider_unavailable", f"POST {url} failed: {exc}") from exc


def get_metadata() -> dict[str, Any]:
    """The provider's discovery document, cached for ``METADATA_TTL_SECONDS``."""
    iss = issuer()
    now = time.monotonic()
    with _cache_lock:
        cached = _metadata_cache.get(iss)
        if cached is not None and now - cached[0] < METADATA_TTL_SECONDS:
            return cached[1]

    data = _get_json(f"{iss}/.well-known/openid-configuration")
    if data.get("issuer") != iss:
        raise SignInRefused(
            "provider_unavailable",
            f"discovery issuer {data.get('issuer')!r} does not match {iss!r}",
        )
    for key in ("authorization_endpoint", "token_endpoint", "jwks_uri"):
        if not isinstance(data.get(key), str) or not data[key]:
            raise SignInRefused("provider_unavailable", f"discovery lacks {key}")

    with _cache_lock:
        _metadata_cache.clear()
        _metadata_cache[iss] = (now, data)
    return data


def get_key_set(force: bool = False) -> KeySet:
    """The provider's signing keys (JWKS), cached; ``force`` refetches."""
    uri = get_metadata()["jwks_uri"]
    now = time.monotonic()
    with _cache_lock:
        cached = _jwks_cache.get(uri)
        if not force and cached is not None and now - cached[0] < METADATA_TTL_SECONDS:
            return cached[1]

    data = _get_json(uri)
    try:
        key_set = KeySet.import_key_set(data)  # type: ignore[arg-type]
    except (JoseError, ValueError, KeyError, TypeError) as exc:
        raise SignInRefused("provider_unavailable", f"unusable JWKS: {exc}") from exc

    with _cache_lock:
        _jwks_cache.clear()
        _jwks_cache[uri] = (now, key_set)
    return key_set


def begin(next_path: str = "") -> tuple[str, str]:
    """Start a sign-in: returns (provider authorization URL, flow cookie value)."""
    meta = get_metadata()
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(64)  # 86 chars; RFC 7636 allows 43..128
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode("ascii")).digest())
        .rstrip(b"=")
        .decode("ascii")
    )
    params = {
        "response_type": "code",
        "client_id": settings.BOS_OIDC_CLIENT_ID,
        "redirect_uri": settings.BOS_OIDC_REDIRECT_URI,
        "scope": SCOPE,
        "state": state,
        "nonce": nonce,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    endpoint = meta["authorization_endpoint"]
    url = endpoint + ("&" if "?" in endpoint else "?") + urlencode(params)
    flow = _sign(
        {
            "type": _FLOW_TYPE,
            "state": state,
            "nonce": nonce,
            "verifier": verifier,
            "next": safe_next(next_path),
        },
        FLOW_SECONDS,
    )
    return url, flow


def read_flow(cookie: str | None, state: str | None) -> dict[str, Any]:
    """The flow started by this browser, provided ``state`` matches it."""
    if not cookie or not state:
        raise SignInRefused("invalid_state", "missing flow cookie or state")
    try:
        flow = _unsign(cookie)
    except JWTError as exc:
        raise SignInRefused("invalid_state", f"flow cookie rejected: {exc}") from exc
    if flow.get("type") != _FLOW_TYPE or not isinstance(flow.get("state"), str):
        raise SignInRefused("invalid_state", "not a flow cookie")
    if not secrets.compare_digest(flow["state"], state):
        raise SignInRefused("invalid_state", "state does not match")
    return flow


def exchange_code(code: str, verifier: str) -> dict[str, Any]:
    """Trade the authorization code for tokens at the provider (back channel)."""
    meta = get_metadata()
    res = _post_form(
        meta["token_endpoint"],
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.BOS_OIDC_REDIRECT_URI,
            "code_verifier": verifier,
            "client_id": settings.BOS_OIDC_CLIENT_ID,
            "client_secret": settings.BOS_OIDC_CLIENT_SECRET,
        },
    )
    try:
        data = res.json()
    except ValueError:
        data = {}
    if res.status_code != 200 or not isinstance(data, dict):
        error = data.get("error") if isinstance(data, dict) else None
        raise SignInRefused(
            "code_rejected", f"token endpoint returned {res.status_code} ({error})"
        )
    if not isinstance(data.get("id_token"), str) or not isinstance(
        data.get("access_token"), str
    ):
        raise SignInRefused("code_rejected", "token response lacks id_token/access_token")
    return data


# ---------------------------------------------------------------------------
# Token verification
# ---------------------------------------------------------------------------

def _decode(token: str) -> dict[str, Any]:
    """Verify the signature against the provider's JWKS and return the claims."""
    for attempt in (1, 2):
        key_set = get_key_set(force=attempt == 2)
        try:
            return dict(
                oidc_jwt.decode(token, key_set, algorithms=SIGNING_ALGORITHMS).claims
            )
        except InvalidKeyIdError as exc:
            if attempt == 1:
                continue  # maybe a key rotation: refetch the keys once
            raise SignInRefused("invalid_token", f"no signing key: {exc}") from exc
        except (JoseError, ValueError) as exc:
            raise SignInRefused(
                "invalid_token", f"{type(exc).__name__}: {exc}"
            ) from exc
    raise SignInRefused("invalid_token", "unreachable")  # pragma: no cover


def _validate(claims: dict[str, Any], what: str, **options: Any) -> None:
    registry = oidc_jwt.JWTClaimsRegistry(leeway=LEEWAY_SECONDS, **options)
    try:
        registry.validate(claims)
    except JoseError as exc:
        raise SignInRefused(
            "invalid_token", f"{what}: {type(exc).__name__}: {exc}"
        ) from exc


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def _display_name(claims: dict[str, Any], email: str) -> str:
    for candidate in (
        claims.get("name"),
        " ".join(
            str(part) for part in (claims.get("given_name"), claims.get("family_name"))
            if part
        ),
        claims.get("preferred_username"),
    ):
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()[:_MAX_LEN]
    return email.split("@", 1)[0][:_MAX_LEN]


def verify_tokens(tokens: dict[str, Any], nonce: str) -> BosIdentity:
    """Verify the ID and access tokens from the code exchange; return the person."""
    client_id = settings.BOS_OIDC_CLIENT_ID
    iss = issuer()

    id_claims = _decode(tokens["id_token"])
    _validate(
        id_claims,
        "id_token",
        iss={"essential": True, "value": iss},
        aud={"essential": True, "value": client_id},
        sub={"essential": True},
        exp={"essential": True},
        nonce={"essential": True, "value": nonce},
    )
    azp = id_claims.get("azp")
    if azp is not None and azp != client_id:
        raise SignInRefused("invalid_token", "id_token azp is another client")
    if len(_as_list(id_claims.get("aud"))) > 1 and azp is None:
        raise SignInRefused("invalid_token", "id_token has several audiences and no azp")

    access_claims = _decode(tokens["access_token"])
    _validate(
        access_claims,
        "access_token",
        iss={"essential": True, "value": iss},
        exp={"essential": True},
    )
    if (
        client_id not in _as_list(access_claims.get("aud"))
        and access_claims.get("azp") != client_id
    ):
        raise SignInRefused("invalid_token", "access_token is for another client")
    if access_claims.get("sub") not in (None, id_claims["sub"]):
        raise SignInRefused("invalid_token", "access_token is for another subject")

    raw_email = id_claims.get("email") or access_claims.get("email")
    email = raw_email.strip().lower() if isinstance(raw_email, str) else ""
    if "@" not in email or len(email) > _MAX_LEN:
        raise SignInRefused("email_missing", "no usable email claim")

    verified = id_claims.get("email_verified", access_claims.get("email_verified"))
    if verified not in (True, "true"):
        raise SignInRefused("email_unverified", f"{email} is not verified at BOS")

    tenant = id_claims.get("bos_tenant_id") or access_claims.get("bos_tenant_id")
    return BosIdentity(
        subject=str(id_claims["sub"]),
        email=email,
        name=_display_name(id_claims, email),
        tenant_id=tenant if isinstance(tenant, str) and tenant else None,
    )


# ---------------------------------------------------------------------------
# Mapping the person to a connectX user
# ---------------------------------------------------------------------------

def find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(
        select(User).where(func.lower(User.email) == email.lower()).order_by(User.id)
    )


def resolve_user(db: Session, identity: BosIdentity) -> User:
    """Find the connectX user for a BOS identity, creating one just in time if allowed."""
    user = find_user_by_email(db, identity.email)
    if user is not None:
        if not user.is_active:
            raise SignInRefused("account_disabled", f"{identity.email} is deactivated")
        return user

    expected_tenant = settings.BOS_TENANT_ID.strip()
    if not expected_tenant or identity.tenant_id != expected_tenant:
        raise SignInRefused(
            "no_account",
            f"no account for {identity.email} and tenant {identity.tenant_id!r} "
            "is not linked to this connectX",
        )
    try:
        _EMAIL.validate_python(identity.email)
    except ValidationError as exc:
        raise SignInRefused(
            "email_unsupported",
            f"{identity.email} fails connectX email validation: {exc.errors()[0]['msg']}",
        ) from exc

    user = User(
        email=identity.email,
        # Unusable random password: this person signs in through BOS.
        password_hash=hash_password(secrets.token_urlsafe(32)),
        full_name=identity.name,
        role=DEFAULT_ROLE,
    )
    db.add(user)
    try:
        db.flush()
        db.add(AlumniProfile(user_id=user.id))
        db.commit()
    except IntegrityError:
        # Created by a concurrent sign-in for the same address: use that one.
        db.rollback()
        user = find_user_by_email(db, identity.email)
        if user is None or not user.is_active:
            raise SignInRefused("no_account", "concurrent provisioning failed")
        return user
    db.refresh(user)
    logger.info(
        "BOS SSO: provisioned user %s (%s) for tenant %s",
        user.id, user.email, identity.tenant_id,
    )
    return user


# ---------------------------------------------------------------------------
# One-time handoff code (callback -> SPA -> /exchange)
# ---------------------------------------------------------------------------

_used_lock = threading.Lock()
_used_handoffs: dict[str, float] = {}  # jti -> expiry (epoch seconds)


def issue_handoff(user_id: int) -> str:
    return _sign(
        {"type": _HANDOFF_TYPE, "sub": str(user_id), "jti": secrets.token_urlsafe(16)},
        HANDOFF_SECONDS,
    )


def redeem_handoff(code: str) -> int:
    """The user id behind a handoff code; each code works once.

    Single use is enforced per process. With several API workers a code could in theory
    be replayed on another worker within its 60 seconds of life; it only ever lives in the
    fragment of the URL the SPA strips immediately.
    """
    try:
        payload = _unsign(code)
    except JWTError as exc:
        raise SignInRefused("invalid_code", str(exc)) from exc
    jti = payload.get("jti")
    if payload.get("type") != _HANDOFF_TYPE or not isinstance(jti, str):
        raise SignInRefused("invalid_code", "not a handoff code")
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError) as exc:
        raise SignInRefused("invalid_code", "bad subject") from exc

    now = time.time()
    with _used_lock:
        for key, expiry in list(_used_handoffs.items()):
            if expiry < now:
                del _used_handoffs[key]
        if jti in _used_handoffs:
            raise SignInRefused("invalid_code", "code already used")
        _used_handoffs[jti] = float(payload.get("exp") or now + HANDOFF_SECONDS)
    return user_id
