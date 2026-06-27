"""Canonical user types (roles) for connectX.

Roles are stored as plain strings on `User.role`. This module is the single
source of truth for the allowed values and their meaning so the app, the
schemas and the seeders stay in sync.
"""
from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"          # Rooman platform administrator — full control
    MODERATOR = "moderator"  # moderates feed / community content
    MENTOR = "mentor"        # alumni offering paid mentorship sessions
    RECRUITER = "recruiter"  # senior pros / employers posting manpower needs
    ALUMNUS = "alumnus"      # regular alumni member (default)


# All valid role values (for validation / docs).
ROLES: tuple[str, ...] = tuple(r.value for r in Role)

DEFAULT_ROLE = Role.ALUMNUS.value

# Roles that have elevated/staff privileges.
STAFF_ROLES: frozenset[str] = frozenset({Role.ADMIN.value, Role.MODERATOR.value})


def is_valid_role(role: str) -> bool:
    return role in ROLES
