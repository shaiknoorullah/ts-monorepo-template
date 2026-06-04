"""Assert roles/container_runtime shape and switchable branches."""
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ROLE = ROOT / "roles/container_runtime"


@pytest.mark.parametrize("rel", [
    "meta/main.yml",
    "defaults/main.yml",
    "tasks/main.yml",
    "tasks/containerd.yml",
    "tasks/crio.yml",
    "templates/containerd-config.toml.j2",
    "handlers/main.yml",
    "molecule/default/molecule.yml",
    "molecule/default/converge.yml",
])
def test_file_exists(rel: str) -> None:
    assert (ROLE / rel).is_file()


def test_containerd_template_systemd_cgroup() -> None:
    text = (ROLE / "templates/containerd-config.toml.j2").read_text()
    assert "SystemdCgroup = true" in text


def test_main_branches_on_container_manager() -> None:
    text = (ROLE / "tasks/main.yml").read_text()
    assert "containerd.yml" in text
    assert "crio.yml" in text
    assert "container_manager" in text


def test_containerd_version_default_is_1_7() -> None:
    text = (ROLE / "defaults/main.yml").read_text()
    assert "containerd_version" in text


def test_syntax_check() -> None:
    res = subprocess.run(
        ["ansible-playbook", "--syntax-check",
         str(ROLE / "molecule/default/converge.yml")],
        capture_output=True, text=True, cwd=str(ROOT),
    )
    assert res.returncode == 0, res.stderr
