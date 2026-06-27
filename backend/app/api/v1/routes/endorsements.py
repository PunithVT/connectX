"""Skill endorsement routes — LinkedIn-style social proof.

Only connected alumni can endorse each other (keeps endorsements meaningful).
Endorsements roll up per skill with counts and the list of endorsers.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.connection import Connection
from app.models.endorsement import Endorsement
from app.models.user import User
from app.schemas.endorsement import EndorseRequest, SkillEndorsement
from app.schemas.user import UserPublic
from app.services.notification_service import notify

router = APIRouter()


def _are_connected(db: Session, a: int, b: int) -> bool:
    return db.scalar(
        select(Connection).where(
            Connection.status == "accepted",
            or_(
                (Connection.requester_id == a) & (Connection.addressee_id == b),
                (Connection.requester_id == b) & (Connection.addressee_id == a),
            ),
        )
    ) is not None


def _aggregate(db: Session, user_id: int, me_id: int) -> list[SkillEndorsement]:
    rows = list(
        db.scalars(
            select(Endorsement).where(Endorsement.endorsee_id == user_id)
        ).all()
    )
    by_skill: dict[str, list[Endorsement]] = {}
    for r in rows:
        by_skill.setdefault(r.skill, []).append(r)

    out: list[SkillEndorsement] = []
    for skill, items in sorted(by_skill.items(), key=lambda kv: -len(kv[1])):
        endorsers = []
        endorsed_by_me = False
        for it in items:
            if it.endorser_id == me_id:
                endorsed_by_me = True
            u = db.get(User, it.endorser_id)
            if u:
                endorsers.append(UserPublic(id=u.id, full_name=u.full_name))
        out.append(
            SkillEndorsement(
                skill=skill,
                count=len(items),
                endorsed_by_me=endorsed_by_me,
                endorsers=endorsers,
            )
        )
    return out


@router.get("/{user_id}", response_model=list[SkillEndorsement])
def list_endorsements(
    user_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SkillEndorsement]:
    return _aggregate(db, user_id, current.id)


@router.post("/{user_id}", response_model=list[SkillEndorsement])
def endorse(
    user_id: int,
    data: EndorseRequest,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SkillEndorsement]:
    if user_id == current.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot endorse yourself")
    if db.get(User, user_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if not _are_connected(db, current.id, user_id):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Connect first to endorse this alumnus"
        )

    skill = data.skill.strip()
    if not skill:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Skill is required")

    existing = db.scalar(
        select(Endorsement).where(
            Endorsement.endorser_id == current.id,
            Endorsement.endorsee_id == user_id,
            Endorsement.skill == skill,
        )
    )
    if not existing:
        db.add(
            Endorsement(
                endorser_id=current.id, endorsee_id=user_id, skill=skill
            )
        )
        db.commit()
        notify(
            db, user_id=user_id, type="endorsement",
            message=f"{current.full_name} endorsed you for {skill}.",
            link=f"/profile/{user_id}",
        )
    return _aggregate(db, user_id, current.id)


@router.delete("/{user_id}", response_model=list[SkillEndorsement])
def remove_endorsement(
    user_id: int,
    data: EndorseRequest,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SkillEndorsement]:
    existing = db.scalar(
        select(Endorsement).where(
            Endorsement.endorser_id == current.id,
            Endorsement.endorsee_id == user_id,
            Endorsement.skill == data.skill.strip(),
        )
    )
    if existing:
        db.delete(existing)
        db.commit()
    return _aggregate(db, user_id, current.id)
