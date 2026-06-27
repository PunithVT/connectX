"""Feed routes (req #4): posts, comments, likes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.crud.post import post_crud
from app.db.session import get_db
from app.models.post import Post
from app.models.user import User
from app.schemas.post import CommentCreate, CommentOut, PostCreate, PostOut

router = APIRouter()


@router.get("", response_model=list[PostOut])
def list_feed(
    limit: int = 20,
    offset: int = 0,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Post]:
    return post_crud.feed(db, limit=limit, offset=offset)


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Post:
    post = Post(author_id=current.id, body=data.body, post_type=data.post_type)
    post_crud.create(db, post)
    return post_crud.get_with_relations(db, post.id)


@router.post("/{post_id}/comments", response_model=CommentOut, status_code=201)
def add_comment(
    post_id: int,
    data: CommentCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CommentOut:
    if post_crud.get(db, post_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    comment = post_crud.add_comment(
        db, post_id=post_id, author_id=current.id, body=data.body
    )
    return comment


@router.post("/{post_id}/like", response_model=PostOut)
def like_post(
    post_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Post:
    post = post_crud.get(db, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    post.likes = (post.likes or 0) + 1
    db.commit()
    return post_crud.get_with_relations(db, post_id)
