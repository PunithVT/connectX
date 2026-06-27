"""Import every model so ``Base.metadata`` is complete.

Imported by Alembic's env.py and by app startup before ``create_all``.
"""
from app.db.base import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.alumni_profile import AlumniProfile  # noqa: F401
from app.models.invite import Invite  # noqa: F401
from app.models.post import Post  # noqa: F401
from app.models.comment import Comment  # noqa: F401
from app.models.mentorship import MentorProfile, MentorshipSession  # noqa: F401
from app.models.opportunity import Opportunity  # noqa: F401
from app.models.startup_project import StartupProject  # noqa: F401
from app.models.community import Community, GroupMembership  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.connection import Connection  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.event import Event, EventRSVP  # noqa: F401
from app.models.endorsement import Endorsement  # noqa: F401
from app.models.mentor_review import MentorReview  # noqa: F401
from app.models.group_post import GroupPost  # noqa: F401
from app.models.spotlight import Spotlight  # noqa: F401
from app.models.application import Application  # noqa: F401
