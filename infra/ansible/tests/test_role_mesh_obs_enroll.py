"""Assert wireguard_mesh, observability_agents, arc_enroll, uems_enroll role shape."""
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]

ROLES = {
    "wireguard_mesh": [
        "meta/main.yml", "defaults/main.yml", "tasks/main.yml",
        "templates/wg0.conf.j2",
    ],
    "observability_agents": [
        "meta/main.yml", "defaults/main.yml", "tasks/main.yml",
    ],
    "arc_enroll": [
        "meta/main.yml", "defaults/main.yml", "tasks/main.yml",
    ],
    "uems_enroll": [
        "meta/main.yml", "defaults/main.yml", "tasks/main.yml",
    ],
}


@pytest.mark.parametrize(
    "role,rel",
    [(r, f) for r, files in ROLES.items() for f in files],
)
def test_role_files(role: str, rel: str) -> None:
    assert (ROOT / "roles" / role / rel).is_file()


def test_wg_template_uses_keepalive_var() -> None:
    text = (ROOT / "roles/wireguard_mesh/templates/wg0.conf.j2").read_text()
    assert "PersistentKeepalive" in text
    assert "{{ wireguard_keepalive }}" in text


def test_wg_mesh_loops_inventory_peers() -> None:
    text = (ROOT / "roles/wireguard_mesh/tasks/main.yml").read_text()
    assert "groups['all']" in text


def test_arc_enroll_off_by_default() -> None:
    text = (ROOT / "roles/arc_enroll/defaults/main.yml").read_text()
    assert "arc_enroll_enabled: false" in text


def test_uems_enroll_off_by_default() -> None:
    text = (ROOT / "roles/uems_enroll/defaults/main.yml").read_text()
    assert "uems_enroll_enabled: false" in text


def test_obs_agents_list_promtail_otel_nodeexporter() -> None:
    text = (ROOT / "roles/observability_agents/tasks/main.yml").read_text()
    assert "promtail" in text
    assert "otel" in text
    assert "node_exporter" in text
