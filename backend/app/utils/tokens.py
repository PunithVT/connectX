"""Opaque token helpers (invite links, etc.)."""
import secrets


def generate_invite_token() -> str:
    """URL-safe, unguessable token for invite accept links."""
    return secrets.token_urlsafe(32)
