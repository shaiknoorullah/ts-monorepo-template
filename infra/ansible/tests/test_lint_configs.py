"""Assert lint configs exist and that ansible-lint + yamllint pass."""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_ansible_lint_config_exists() -> None:
    assert (ROOT / ".ansible-lint").is_file()


def test_yamllint_config_exists() -> None:
    assert (ROOT / ".yamllint").is_file()


def test_molecule_shared_config_exists() -> None:
    assert (ROOT / ".config/molecule/config.yml").is_file()


def test_ansible_lint_passes_on_roles() -> None:
    res = subprocess.run(
        ["ansible-lint", "--profile", "production",
         "-c", ".ansible-lint", "roles/", "playbooks/"],
        capture_output=True, text=True, cwd=str(ROOT),
    )
    assert res.returncode == 0, f"stdout:\n{res.stdout}\nstderr:\n{res.stderr}"


def test_yamllint_passes() -> None:
    res = subprocess.run(
        ["yamllint", "-c", ".yamllint", "."],
        capture_output=True, text=True, cwd=str(ROOT),
    )
    assert res.returncode == 0, f"stdout:\n{res.stdout}\nstderr:\n{res.stderr}"
