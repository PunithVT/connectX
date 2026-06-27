"""Post + Comment CRUD."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.crud.base import CRUDBase
from app.models.comment import Comment
from app.models.post import Post


class CRUDPost(CRUDBase[Post]):
    def feed(self, db: Session, *, limit: int = 20, offset: int = 0) -> list[Post]:
        stmt = (
            select(Post)
            .options(selectinload(Post.author), selectinload(Post.comments))
            .order_by(Post.created_at.desc(), Post.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(db.scalars(stmt).unique().all())

    def get_with_relations(self, db: Session, post_id: int) -> Post | None:
        stmt = (
            select(Post)
            .options(selectinload(Post.author), selectinload(Post.comments))
            .where(Post.id == post_id)
        )
        return db.scalars(stmt).unique().one_or_none()

    def add_comment(
        self, db: Session, *, post_id: int, author_id: int, body: str
    ) -> Comment:
        comment = Comment(post_id=post_id, author_id=author_id, body=body)
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment


post_crud = CRUDPost(Post)
