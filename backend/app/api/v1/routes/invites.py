"""Invite routes (req #1): admin bulk-create + send, public preview + accept."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.crud.invite import invite_crud
from app.db.session import get_db
from app.models.user import User
from app.schemas.invite import (
    InviteAccept,
    InviteBulkCreate,
    InviteCreate,
    InviteOut,
    InvitePreview,
)
from app.services import invite_service

router = APIRouter()


@router.post("", response_model=InviteOut, status_code=status.HTTP_201_CREATED)
def create_invite(
    data: InviteCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> InviteOut:
    invite = invite_service.create_invite(db, data, invited_by=admin.id)
    background.add_task(invite_service.send_invite_email, invite)
    invite.status = "sent"
    db.commit()
    db.refresh(invite)
    return invite


@router.post("/bulk", response_model=list[InviteOut])
def bulk_create(
    data: InviteBulkCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[InviteOut]:
    created = []
    for item in data.invites:
        invite = invite_service.create_invite(db, item, invited_by=admin.id)
        background.add_task(invite_service.send_invite_email, invite)
        invite.status = "sent"
        created.append(invite)
    db.commit()
    return created


@router.get("", response_model=list[InviteOut])
def list_invites(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
) -> list[InviteOut]:
    return invite_crud.list_by_status(db, status_filter)


@router.get("/{token}", response_model=InvitePreview)
def preview(token: str, db: Session = Depends(get_db)) -> InvitePreview:
    invite = invite_crud.get_by_token(db, token)
    if invite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invite not found")
    return InvitePreview(
        email=invite.email,
        full_name=invite.full_name,
        program_trained=invite.program_trained,
        status=invite.status,
    )


@router.post("/accept", status_code=status.HTTP_201_CREATED)
def accept(data: InviteAccept, db: Session = Depends(get_db)) -> dict:
    invite, user_id = invite_service.accept_invite(db, data)
    return {"status": "accepted", "user_id": user_id, "email": invite.email}
