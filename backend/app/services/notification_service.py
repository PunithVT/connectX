"""Create in-app notifications."""
from sqlalchemy.orm import Session

from app.models.notification import Notification


def notify(
    db: Session,
    *,
    user_id: int,
    message: str,
    type: str = "info",
    link: str | None = None,
    commit: bool = True,
) -> Notification:
    n = Notification(user_id=user_id, message=message, type=type, link=link)
    db.add(n)
    if commit:
        db.commit()
        db.refresh(n)
    return n
