"""Aggregates all v1 route modules under one router."""
from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    invites,
    profiles,
    feed,
    mentorship,
    opportunities,
    startupvarsity,
    community,
    notifications,
    connections,
    messages,
    events,
    endorsements,
    spotlight,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(invites.router, prefix="/invites", tags=["invites"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(feed.router, prefix="/feed", tags=["feed"])
api_router.include_router(mentorship.router, prefix="/mentorship", tags=["mentorship"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])
api_router.include_router(startupvarsity.router, prefix="/startupvarsity", tags=["startupvarsity"])
api_router.include_router(community.router, prefix="/community", tags=["community"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(connections.router, prefix="/connections", tags=["connections"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(endorsements.router, prefix="/endorsements", tags=["endorsements"])
api_router.include_router(spotlight.router, prefix="/spotlight", tags=["spotlight"])
