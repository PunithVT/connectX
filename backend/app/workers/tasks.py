"""Celery tasks: bulk invite email sends.

These are the async path. The API can also send synchronously via FastAPI
BackgroundTasks when a broker isn't available.
"""
from app.db.session import SessionLocal
from app.crud.invite import invite_crud
from app.services import invite_service
from app.workers.celery_app import celery_app


@celery_app.task(name="invites.send")
def send_invite_task(invite_id: int) -> str:
    db = SessionLocal()
    try:
        invite = invite_crud.get(db, invite_id)
        if invite is None:
            return "not_found"
        invite_service.send_invite_email(invite)
        invite.status = "sent"
        db.commit()
        return "sent"
    finally:
        db.close()


@celery_app.task(name="invites.send_bulk")
def send_bulk_invites_task(invite_ids: list[int]) -> int:
    for iid in invite_ids:
        send_invite_task.delay(iid)
    return len(invite_ids)
