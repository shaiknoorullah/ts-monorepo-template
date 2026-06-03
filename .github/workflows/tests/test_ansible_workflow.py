"""Assert the Section 13.3 ansible-validate gate is wired."""
import subprocess
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[3]
WF = ROOT / ".github/workflows/ansible.yml"


def test_workflow_exists() -> None:
    assert WF.is_file()


def test_workflow_yaml_parses() -> None:
    data = yaml.safe_load(WF.read_text())
    assert data["name"] == "ansible-validate"
    # GitHub Actions parses `on:` as the boolean True under YAML 1.1; accept either.
    on_key = "on" if "on" in data else True
    assert "pull_request" in data[on_key]


def test_workflow_has_required_jobs() -> None:
    data = yaml.safe_load(WF.read_text())
    jobs = set(data["jobs"].keys())
    assert {"lint", "syntax-check", "molecule"}.issubset(jobs), jobs


def test_lint_job_runs_ansible_lint_and_yamllint() -> None:
    data = yaml.safe_load(WF.read_text())
    steps = data["jobs"]["lint"]["steps"]
    cmds = " ".join(step.get("run", "") for step in steps if "run" in step)
    assert "ansible-lint" in cmds
    assert "yamllint" in cmds


def test_syntax_check_runs_all_playbooks() -> None:
    data = yaml.safe_load(WF.read_text())
    steps = data["jobs"]["syntax-check"]["steps"]
    cmds = " ".join(step.get("run", "") for step in steps if "run" in step)
    for pb in ["cluster.yml", "scale.yml", "reset.yml",
               "upgrade.yml", "backup.yml"]:
        assert pb in cmds


def test_molecule_matrix_covers_common() -> None:
    data = yaml.safe_load(WF.read_text())
    matrix = data["jobs"]["molecule"]["strategy"]["matrix"]
    # Section 13.3: molecule converge for at least one role
    assert "common" in matrix["role"]


def test_actionlint_clean() -> None:
    res = subprocess.run(
        ["actionlint", str(WF)],
        capture_output=True, text=True,
    )
    assert res.returncode == 0, res.stdout + res.stderr
