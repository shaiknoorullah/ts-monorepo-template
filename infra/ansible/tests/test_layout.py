"""Assert Section 9.2 repo layout exists under infra/ansible/."""
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_DIRS = [
    "inventory",
    "group_vars",
    "host_vars",
    "roles",
    "playbooks",
]

REQUIRED_FILES = [
    "ansible.cfg",
    "requirements.yml",
]


@pytest.mark.parametrize("rel", REQUIRED_DIRS)
def test_required_directory_exists(rel: str) -> None:
    target = ROOT / rel
    assert target.is_dir(), f"missing directory infra/ansible/{rel}"


@pytest.mark.parametrize("rel", REQUIRED_FILES)
def test_required_file_exists(rel: str) -> None:
    target = ROOT / rel
    assert target.is_file(), f"missing file infra/ansible/{rel}"


def test_ansible_cfg_pins_python_interpreter_auto() -> None:
    cfg = (ROOT / "ansible.cfg").read_text()
    assert "interpreter_python = auto_silent" in cfg


def test_requirements_pins_community_general() -> None:
    text = (ROOT / "requirements.yml").read_text()
    assert "community.general" in text
    assert "kubernetes.core" in text
