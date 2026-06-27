"""Match seeking ↔ hiring opportunities by expertise domain (req #4).

When a new opportunity is posted, find counterpart opportunities in the same
domain and notify their authors so the right people connect.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.opportunity import Opportunity
from app.services.notification_service import notify

_COUNTERPART = {"hiring": "seeking", "seeking": "hiring"}


def fan_out_matches(db: Session, opportunity: Opportunity) -> int:
    """Notify authors of counterpart opportunities in the same domain.

    Returns the number of notifications created.
    """
    if not opportunity.expertise_domain:
        return 0

    counterpart_kind = _COUNTERPART.get(opportunity.kind)
    if counterpart_kind is None:
        return 0

    stmt = (
        select(Opportunity)
        .where(
            Opportunity.kind == counterpart_kind,
            Opportunity.status == "open",
            Opportunity.expertise_domain.ilike(f"%{opportunity.expertise_domain}%"),
            Opportunity.author_id != opportunity.author_id,
        )
        .limit(50)
    )
    matches = list(db.scalars(stmt).all())

    verb = "hiring in" if opportunity.kind == "hiring" else "looking for a role in"
    count = 0
    for match in matches:
        notify(
            db,
            user_id=match.author_id,
            type="match",
            message=(
                f"New {opportunity.kind} post {verb} "
                f"{opportunity.expertise_domain}: \"{opportunity.title}\""
            ),
            link=f"/opportunities?highlight={opportunity.id}",
            commit=False,
        )
        count += 1
    db.commit()
    return count
