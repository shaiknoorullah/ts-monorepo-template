from typing import Callable

from fastapi import FastAPI

from .handlers import health_router


def create_app(readiness: Callable[[], bool] = lambda: True) -> FastAPI:
    app = FastAPI(title="py-hello", version="0.1.0")
    app.include_router(health_router(readiness))
    return app
