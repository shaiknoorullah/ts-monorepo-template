"""Locks the generated-binding shape so silent drift trips CI."""
from contracts.user.v1 import user_pb2
from contracts.health.v1 import health_pb2


def test_user_descriptor_fields() -> None:
    field_names = sorted(f.name for f in user_pb2.User.DESCRIPTOR.fields)
    assert field_names == ["created_at", "display_name", "email", "id"]


def test_health_serving_enum() -> None:
    assert health_pb2.HealthCheckResponse.SERVING_STATUS_SERVING == 1
