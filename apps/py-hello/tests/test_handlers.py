from fastapi.testclient import TestClient

from py_hello.app import create_app


def test_healthz_returns_ok() -> None:
    app = create_app(readiness=lambda: True)
    client = TestClient(app)
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_readyz_returns_503_when_dependency_down() -> None:
    app = create_app(readiness=lambda: False)
    client = TestClient(app)
    resp = client.get("/readyz")
    assert resp.status_code == 503
