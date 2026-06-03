from typing import Awaitable, Callable

from fastapi import APIRouter, HTTPException, Response


def health_router(readiness: Callable[[], bool]) -> APIRouter:
    r = APIRouter()

    @r.get("/healthz")
    def healthz() -> dict[str, str]:
        return {"status": "ok"}

    @r.get("/readyz")
    def readyz() -> Response:
        if not readiness():
            return Response(content='{"status":"down"}', media_type="application/json", status_code=503)
        return Response(content='{"status":"ok"}', media_type="application/json", status_code=200)

    return r


def users_router(
    create_user: Callable[[dict[str, str]], Awaitable[dict[str, str]]],
    get_user: Callable[[str], Awaitable[dict[str, str] | None]],
    list_users: Callable[[], Awaitable[list[dict[str, str]]]],
) -> APIRouter:
    r = APIRouter(prefix="/v1/users")

    @r.get("")
    async def list_endpoint() -> list[dict[str, str]]:
        return await list_users()

    @r.post("", status_code=201)
    async def create_endpoint(body: dict[str, str]) -> dict[str, str]:
        return await create_user(body)

    @r.get("/{user_id}")
    async def get_endpoint(user_id: str) -> dict[str, str]:
        u = await get_user(user_id)
        if u is None:
            raise HTTPException(status_code=404)
        return u

    return r
