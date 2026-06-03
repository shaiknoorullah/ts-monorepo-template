"""Assert roles/common shape and key sysctl/modules values."""
import subprocess
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]
ROLE = ROOT / "roles/common"

REQUIRED = [
    "meta/main.yml",
    "defaults/main.yml",
    "tasks/main.yml",
    "tasks/sysctl.yml",
    "tasks/kernel_modules.yml",
    "tasks/limits.yml",
    "tasks/sshd.yml",
    "tasks/fail2ban.yml",
    "tasks/auditd.yml",
    "tasks/chrony.yml",
    "handlers/main.yml",
    "templates/99-kubernetes.conf.j2",
    "templates/k8s-modules.conf.j2",
    "templates/limits-k8s.conf.j2",
    "molecule/default/molecule.yml",
    "molecule/default/converge.yml",
    "molecule/default/verify.yml",
]


@pytest.mark.parametrize("rel", REQUIRED)
def test_file_exists(rel: str) -> None:
    assert (ROLE / rel).is_file(), f"missing roles/common/{rel}"


def test_sysctl_template_has_required_keys() -> None:
    text = (ROLE / "templates/99-kubernetes.conf.j2").read_text()
    for key in [
        "net.ipv4.ip_forward",
        "net.bridge.bridge-nf-call-iptables",
        "net.bridge.bridge-nf-call-ip6tables",
        "fs.inotify.max_user_instances",
        "fs.inotify.max_user_watches",
    ]:
        assert key in text, f"missing sysctl key {key}"


def test_modules_template_has_br_netfilter_overlay() -> None:
    text = (ROLE / "templates/k8s-modules.conf.j2").read_text()
    assert "br_netfilter" in text
    assert "overlay" in text


def test_tasks_main_includes_all_subtasks() -> None:
    text = (ROLE / "tasks/main.yml").read_text()
    for inc in ["sysctl.yml", "kernel_modules.yml", "limits.yml",
                "sshd.yml", "fail2ban.yml", "auditd.yml", "chrony.yml"]:
        assert inc in text, f"tasks/main.yml does not include {inc}"


def test_molecule_uses_docker_driver() -> None:
    cfg = yaml.safe_load((ROLE / "molecule/default/molecule.yml").read_text())
    assert cfg["driver"]["name"] == "docker"


def test_ansible_syntax_check_common() -> None:
    result = subprocess.run(
        ["ansible-playbook", "--syntax-check",
         str(ROLE / "molecule/default/converge.yml")],
        capture_output=True, text=True, cwd=str(ROOT),
    )
    assert result.returncode == 0, result.stderr
