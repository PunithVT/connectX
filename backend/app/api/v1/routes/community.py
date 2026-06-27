"""Community routes (req #2a): groups for mutual help + per-group discussion feed."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.community import Community, GroupMembership
from app.models.group_post import GroupPost
from app.models.user import User
from app.schemas.group_post import GroupPostCreate, GroupPostOut
from app.schemas.notification import CommunityCreate, CommunityOut

router = APIRouter()


def _membership(db: Session, community_id: int, user_id: int) -> GroupMembership | None:
    return db.scalar(
        select(GroupMembership).where(
            GroupMembership.community_id == community_id,
            GroupMembership.user_id == user_id,
        )
    )


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


@router.get("/{community_id}/posts", response_model=list[GroupPostOut])
def list_group_posts(
    community_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[GroupPost]:
    if db.get(Community, community_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Community not found")
    return list(
        db.scalars(
            select(GroupPost)
            .where(GroupPost.community_id == community_id)
            .order_by(GroupPost.created_at.desc())
        ).all()
    )


@router.post("/{community_id}/posts", response_model=GroupPostOut, status_code=201)
def create_group_post(
    community_id: int,
    data: GroupPostCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GroupPost:
    if db.get(Community, community_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Community not found")
    if _membership(db, community_id, current.id) is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Join the group to post in its feed"
        )
    body = data.body.strip()
    if not body:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Post body is required")
    post = GroupPost(community_id=community_id, author_id=current.id, body=body)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/{community_id}/posts/{post_id}")
def delete_group_post(
    community_id: int,
    post_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    post = db.get(GroupPost, post_id)
    if post is None or post.community_id != community_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    membership = _membership(db, community_id, current.id)
    is_moderator = membership is not None and membership.role == "moderator"
    if post.author_id != current.id and not is_moderator and current.role != "admin":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Only the author or a moderator can delete"
        )
    db.delete(post)
    db.commit()
    return {"status": "ok"}
