"""Community routes (req #2a): groups for mutual help."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.community import Community, GroupMembership
from app.models.user import User
from app.schemas.notification import CommunityCreate, CommunityOut

router = APIRouter()


def _to_out(db: Session, community: Community) -> CommunityOut:
    count = db.scalar(
        select(func.count())
        .select_from(GroupMembership)
        .where(GroupMembership.community_id == community.id)
    )
    return CommunityOut(
        id=community.id,
        name=community.name,
        slug=community.slug,
        description=community.description,
        member_count=count or 0,
    )


@router.get("", response_model=list[CommunityOut])
def list_communities(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CommunityOut]:
    communities = list(db.scalars(select(Community).order_by(Community.name)).all())
    return [_to_out(db, c) for c in communities]


@router.post("", response_model=CommunityOut, status_code=status.HTTP_201_CREATED)
def create_community(
    data: CommunityCreate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommunityOut:
    community = Community(**data.model_dump())
    db.add(community)
    db.commit()
    db.refresh(community)
    return _to_out(db, community)


@router.post("/{community_id}/join", response_model=CommunityOut)
def join_community(
    community_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommunityOut:
    community = db.get(Community, community_id)
    if community is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Community not found")
    existing = db.scalar(
        select(GroupMembership).where(
            GroupMembership.community_id == community_id,
            GroupMembership.user_id == current.id,
        )
    )
    if not existing:
        db.add(GroupMembership(community_id=community_id, user_id=current.id))
        db.commit()
    return _to_out(db, community)
