"""Assert kubeadm_install and kubernetes_join role shape + key knob propagation."""
import subprocess
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
INSTALL = ROOT / "roles/kubeadm_install"
JOIN = ROOT / "roles/kubernetes_join"


@pytest.mark.parametrize("rel", [
    "meta/main.yml", "defaults/main.yml", "tasks/main.yml",
    "tasks/apt.yml", "tasks/init.yml",
    "templates/kubeadm-config.yaml.j2",
])
def test_kubeadm_install_files(rel: str) -> None:
    assert (INSTALL / rel).is_file()


@pytest.mark.parametrize("rel", [
    "meta/main.yml", "defaults/main.yml", "tasks/main.yml",
    "tasks/token.yml", "tasks/join.yml",
])
def test_kubernetes_join_files(rel: str) -> None:
    assert (JOIN / rel).is_file()


def test_kubeadm_config_uses_group_var() -> None:
    text = (INSTALL / "templates/kubeadm-config.yaml.j2").read_text()
    assert "{{ kube_version }}" in text
    assert "podSubnet" in text
    assert "{{ pod_cidr }}" in text
    assert "{{ service_cidr }}" in text


def test_init_runs_only_on_first_cp() -> None:
    text = (INSTALL / "tasks/init.yml").read_text()
    assert "inventory_hostname == groups['control_plane'][0]" in text


def test_join_role_depends_on_container_runtime() -> None:
    meta = yaml.safe_load((JOIN / "meta/main.yml").read_text())
    deps = [d["role"] if isinstance(d, dict) else d for d in meta.get("dependencies", [])]
    assert "container_runtime" in deps


def test_syntax_check_kubeadm_install() -> None:
    # render a minimal playbook including the role for syntax check
    play = ROOT / "playbooks/_smoke_kubeadm_install.yml"
    play.write_text(
        "---\n"
        "- hosts: localhost\n"
        "  gather_facts: false\n"
        "  roles:\n"
        "    - role: kubeadm_install\n"
    )
    res = subprocess.run(
        ["ansible-playbook", "--syntax-check", str(play)],
        capture_output=True, text=True, cwd=str(ROOT),
    )
    play.unlink()
    assert res.returncode == 0, res.stderr
