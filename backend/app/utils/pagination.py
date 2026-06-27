"""Generic pagination helpers."""
from dataclasses import dataclass
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


@dataclass
class PageParams:
    limit: int = 20
    offset: int = 0


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int
    has_more: bool

    @classmethod
    def build(cls, items: list[T], total: int, params: PageParams) -> "Page[T]":
        return cls(
            items=items,
            total=total,
            limit=params.limit,
            offset=params.offset,
            has_more=params.offset + len(items) < total,
        )
