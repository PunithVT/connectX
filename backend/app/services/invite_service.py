"""Invite business logic: create, (re)send, accept (req #1, #3)."""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.invite import invite_crud
from app.crud.user import user_crud
from app.models.alumni_profile import AlumniProfile
from app.models.invite import Invite
from app.schemas.invite import InviteAccept, InviteCreate
from app.services import email_service
from app.utils.tokens import generate_invite_token


def create_invite(db: Session, data: InviteCreate, invited_by: int | None = None) -> Invite:
    existing = invite_crud.get_by_email(db, data.email)
    if existing and existing.status == "accepted":
        raise HTTPException(status.HTTP_409_CONFLICT, "Alum already joined")

    expires = datetime.now(timezone.utc) + timedelta(
        hours=settings.INVITE_TOKEN_EXPIRE_HOURS
    )
    invite = existing or Invite(email=data.email)
    invite.full_name = data.full_name
    invite.program_trained = data.program_trained
    invite.batch_year = data.batch_year
    invite.token = generate_invite_token()
    invite.status = "pending"
    invite.invited_by = invited_by
    invite.expires_at = expires

    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def send_invite_email(invite: Invite) -> None:
    accept_url = f"{settings.FRONTEND_BASE_URL}/invite/{invite.token}"
    html = email_service.render(
        "invite.html",
        full_name=invite.full_name or "there",
        program=invite.program_trained or "Rooman",
        accept_url=accept_url,
    )
    email_service.send_email(
        invite.email, "You're invited to the Rooman Alumni Network", html
    )


def accept_invite(db: Session, data: InviteAccept) -> tuple[Invite, int]:
    invite = invite_crud.get_by_token(db, data.token)
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invalid invite token")
    if invite.status == "accepted":
        raise HTTPException(status.HTTP_409_CONFLICT, "Invite already used")

    expires_at = invite.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        invite.status = "expired"
        db.commit()
        raise HTTPException(status.HTTP_410_GONE, "Invite has expired")

    if user_crud.get_by_email(db, invite.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Account already exists")

    user = user_crud.create_user(
        db, email=invite.email, password=data.password, full_name=data.full_name
    )
    profile = AlumniProfile(
        user_id=user.id,
        program_trained=invite.program_trained,
        batch_year=invite.batch_year,
        current_company=data.current_company,
        current_title=data.current_title,
        expertise_domain=data.expertise_domain,
        skills=data.skills,
        location=data.location,
        linkedin_url=data.linkedin_url,
        open_to_mentoring=data.open_to_mentoring,
        open_to_opportunities=data.open_to_opportunities,
        interested_in_startupvarsity=data.interested_in_startupvarsity,
    )
    db.add(profile)
    invite.status = "accepted"
    invite.accepted_at = datetime.now(timezone.utc)
    db.commit()

    # welcome email (best-effort)
    html = email_service.render("welcome.html", full_name=user.full_name)
    email_service.send_email(user.email, "Welcome to the Rooman Alumni Network", html)
    return invite, user.id
