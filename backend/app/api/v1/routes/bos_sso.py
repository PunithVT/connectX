"""Sign in with BOS routes. Logic lives in ``app/services/bos_sso.py``.

Everything except ``/config`` answers 404 while SSO is off, so merging this changes
nothing until ``BOS_SSO_ENABLED`` and the ``BOS_OIDC_*`` settings are provided.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token
from app.services import bos_sso
from app.services.bos_sso import SignInRefused

logger = logging.getLogger(__name__)

router = APIRouter()


class BosSsoConfig(BaseModel):
    enabled: bool


class BosCodeExchange(BaseModel):
    code: str


def _require_enabled() -> None:
    if not bos_sso.is_enabled():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not Found")


def _login_page_with_error(code: str) -> str:
    return bos_sso.frontend_url("/login", query={"sso_error": code})


@router.get("/config", response_model=BosSsoConfig)
def sso_config() -> BosSsoConfig:
    """Whether the login page should offer "Sign in with BOS"."""
    return BosSsoConfig(enabled=bos_sso.is_enabled())


@router.get("/login", dependencies=[Depends(_require_enabled)])
def sso_login(next_path: str = Query("", alias="next")) -> RedirectResponse:
    """Send the browser to the BOS sign-in page."""
    try:
        url, flow = bos_sso.begin(next_path)
    except SignInRefused as exc:
        logger.warning("BOS sign-in could not start (%s): %s", exc.code, exc.detail)
        return RedirectResponse(_login_page_with_error(exc.code), status_code=302)
    response = RedirectResponse(url, status_code=302)
    response.set_cookie(
        bos_sso.FLOW_COOKIE,
        flow,
        max_age=bos_sso.FLOW_SECONDS,
        path=bos_sso.cookie_path(),
        secure=bos_sso.cookie_secure(),
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/callback", dependencies=[Depends(_require_enabled)])
def sso_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """Where BOS sends the browser back; ends on the SPA with a one-time code."""
    try:
        if error:
            reason = "cancelled" if error == "access_denied" else "provider_error"
            raise SignInRefused(reason, f"provider returned error={error}")
        flow = bos_sso.read_flow(request.cookies.get(bos_sso.FLOW_COOKIE), state)
        if not code:
            raise SignInRefused("invalid_state", "callback without a code")
        tokens = bos_sso.exchange_code(code, flow["verifier"])
        identity = bos_sso.verify_tokens(tokens, nonce=flow["nonce"])
        user = bos_sso.resolve_user(db, identity)
        fragment = {"code": bos_sso.issue_handoff(user.id)}
        if flow.get("next"):
            fragment["next"] = flow["next"]
        target = bos_sso.frontend_url("/auth/bos/complete", fragment=fragment)
    except SignInRefused as exc:
        logger.warning("BOS sign-in refused (%s): %s", exc.code, exc.detail)
        target = _login_page_with_error(exc.code)

    response = RedirectResponse(target, status_code=302)
    response.delete_cookie(
        bos_sso.FLOW_COOKIE,
        path=bos_sso.cookie_path(),
        secure=bos_sso.cookie_secure(),
        httponly=True,
        samesite="lax",
    )
    return response


@router.post(
    "/exchange", response_model=Token, dependencies=[Depends(_require_enabled)]
)
def sso_exchange(body: BosCodeExchange, db: Session = Depends(get_db)) -> Token:
    """Trade the one-time code for the same tokens password sign-in returns."""
    try:
        user_id = bos_sso.redeem_handoff(body.code)
    except SignInRefused as exc:
        logger.warning("BOS sign-in code refused: %s", exc.detail)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired sign-in code"
        ) from exc
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired sign-in code")
    return Token(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )
