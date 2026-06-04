import pytest
from testcontainers.postgres import PostgresContainer

from py_hello.store import UserStore


@pytest.mark.asyncio
async def test_user_store_round_trip() -> None:
    with PostgresContainer("postgres:16-alpine") as pg:
        dsn = pg.get_connection_url().replace("postgresql+psycopg2", "postgresql+asyncpg")
        store = UserStore(dsn)
        await store.init_schema()
        created = await store.create("11111111-1111-1111-1111-111111111111", "a@b.c", "Alice")
        assert created["email"] == "a@b.c"
        got = await store.get("11111111-1111-1111-1111-111111111111")
        assert got is not None
        assert got["display_name"] == "Alice"
