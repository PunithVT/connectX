"""Alumni success stories / spotlight — re-engagement & marketing showcase."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.spotlight import Spotlight
from app.models.user import User
from app.schemas.spotlight import SpotlightCreate, SpotlightOut

router = APIRouter()


@router.get("", response_model=list[SpotlightOut])
def list_spotlights(
    featured_only: bool = False,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Spotlight]:
    stmt = select(Spotlight)
    if featured_only:
        stmt = stmt.where(Spotlight.is_featured.is_(True))
    # Featured first, then newest.
    stmt = stmt.order_by(desc(Spotlight.is_featured), desc(Spotlight.created_at))
    return list(db.scalars(stmt).all())


@router.post("", response_model=SpotlightOut, status_code=201)
def share_story(
    data: SpotlightCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Spotlight:
    story = Spotlight(user_id=current.id, **data.model_dump())
    db.add(story)
    db.commit()
    db.refresh(story)
    return story


@router.post("/{spotlight_id}/like", response_model=SpotlightOut)
def like_story(
    spotlight_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Spotlight:
    story = db.get(Spotlight, spotlight_id)
    if story is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Story not found")
    story.likes += 1
    db.commit()
    db.refresh(story)
    return story


@router.post("/{spotlight_id}/feature", response_model=SpotlightOut)
def feature_story(
    spotlight_id: int,
    featured: bool = True,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> Spotlight:
    story = db.get(Spotlight, spotlight_id)
    if story is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Story not found")
    story.is_featured = featured
    db.commit()
    db.refresh(story)
    return story
