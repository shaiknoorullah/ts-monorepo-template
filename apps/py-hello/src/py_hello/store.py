from typing import Any
from uuid import UUID

from sqlalchemy import Column, DateTime, String, func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class UserRow(Base):
    __tablename__ = "users"
    id: Any = Column(String, primary_key=True)
    email: Any = Column(String, nullable=False)
    display_name: Any = Column(String, nullable=False)
    created_at: Any = Column(DateTime(timezone=True), server_default=func.now())


class UserStore:
    def __init__(self, dsn: str) -> None:
        self._engine = create_async_engine(dsn)
        self._session = async_sessionmaker(self._engine, expire_on_commit=False)

    async def init_schema(self) -> None:
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def create(self, user_id: str, email: str, display_name: str) -> dict[str, str]:
        async with self._session() as s, s.begin():
            s.add(UserRow(id=user_id, email=email, display_name=display_name))
        return {"id": user_id, "email": email, "display_name": display_name}

    async def get(self, user_id: str) -> dict[str, str] | None:
        async with self._session() as s:
            row = await s.get(UserRow, user_id)
            if row is None:
                return None
            return {"id": row.id, "email": row.email, "display_name": row.display_name}

    async def list(self, limit: int = 100) -> list[dict[str, str]]:
        async with self._session() as s:
            rows = (await s.execute(select(UserRow).limit(limit))).scalars().all()
            return [{"id": r.id, "email": r.email, "display_name": r.display_name} for r in rows]


def is_valid_uuid(value: str) -> bool:
    try:
        UUID(value)
        return True
    except ValueError:
        return False
