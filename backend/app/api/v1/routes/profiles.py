"""Alumni profile routes (req #3)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.alumni_profile import AlumniProfile
from app.models.user import User
from app.schemas.alumni_profile import AlumniProfileOut, AlumniProfileUpdate

router = APIRouter()


def _get_profile(db: Session, user_id: int) -> AlumniProfile | None:
    stmt = (
        select(AlumniProfile)
        .options(selectinload(AlumniProfile.user))
        .where(AlumniProfile.user_id == user_id)
    )
    return db.scalars(stmt).one_or_none()


@router.get("/me", response_model=AlumniProfileOut)
def my_profile(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlumniProfile:
    profile = _get_profile(db, current.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
    return profile


@router.put("/me", response_model=AlumniProfileOut)
def update_my_profile(
    data: AlumniProfileUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlumniProfile:
    profile = _get_profile(db, current.id)
    if profile is None:
        profile = AlumniProfile(user_id=current.id)
        db.add(profile)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{user_id}", response_model=AlumniProfileOut)
def get_profile(
    user_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlumniProfile:
    profile = _get_profile(db, user_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
    return profile


@router.get("", response_model=list[AlumniProfileOut])
def list_profiles(
    domain: str | None = None,
    limit: int = 20,
    offset: int = 0,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AlumniProfile]:
    stmt = (
        select(AlumniProfile)
        .options(selectinload(AlumniProfile.user))
        .order_by(AlumniProfile.id.desc())
    )
    if domain:
        stmt = stmt.where(AlumniProfile.expertise_domain.ilike(f"%{domain}%"))
    return list(db.scalars(stmt.limit(limit).offset(offset)).all())
