"""Assert all five playbooks exist, parse, and (for cluster.yml) phase-order roles."""
import subprocess
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
PB = ROOT / "playbooks"


PLAYBOOKS = [
    "cluster.yml",
    "scale.yml",
    "reset.yml",
    "upgrade.yml",
    "backup.yml",
]


@pytest.mark.parametrize("pb", PLAYBOOKS)
def test_playbook_exists(pb: str) -> None:
    assert (PB / pb).is_file()


@pytest.mark.parametrize("pb", PLAYBOOKS)
def test_playbook_syntax(pb: str) -> None:
    res = subprocess.run(
        ["ansible-playbook",
         "-i", "inventory/example.hosts.yml",
         "--syntax-check", f"playbooks/{pb}"],
        capture_output=True, text=True, cwd=str(ROOT),
    )
    assert res.returncode == 0, res.stderr


def test_cluster_yml_phase_order() -> None:
    """Assert Section 9.10 cluster.yml phases in declared order."""
    plays = yaml.safe_load((PB / "cluster.yml").read_text())
    role_seq = []
    for play in plays:
        for r in play.get("roles", []):
            role_seq.append(r if isinstance(r, str) else r.get("role"))
    expected = [
        "common", "container_runtime", "kubeadm_install",
        "kubernetes_join", "cni_install",
        "kubernetes_join", "longhorn_prep",
        "wireguard_mesh", "observability_agents",
    ]
    # ordering preserved across plays
    assert role_seq == expected, f"got {role_seq}"


def test_reset_yml_requires_confirm() -> None:
    text = (PB / "reset.yml").read_text()
    assert "confirm_reset" in text
    assert "fail" in text  # fails when confirm_reset != yes


def test_backup_yml_runs_etcd_snapshot() -> None:
    text = (PB / "backup.yml").read_text()
    assert "etcdctl snapshot save" in text


def test_upgrade_yml_uses_kubeadm_upgrade() -> None:
    text = (PB / "upgrade.yml").read_text()
    assert "kubeadm upgrade plan" in text
    assert "kubeadm upgrade apply" in text
