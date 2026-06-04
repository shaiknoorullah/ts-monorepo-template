"""Assert cni_install and longhorn_prep role shape and forensic-borrow knobs."""
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
CNI = ROOT / "roles/cni_install"
LH = ROOT / "roles/longhorn_prep"


@pytest.mark.parametrize("rel", [
    "meta/main.yml", "defaults/main.yml", "tasks/main.yml",
    "tasks/calico.yml", "tasks/cilium.yml", "tasks/flannel.yml",
    "templates/calico-installation.yaml.j2",
])
def test_cni_files(rel: str) -> None:
    assert (CNI / rel).is_file()


@pytest.mark.parametrize("rel", [
    "meta/main.yml", "defaults/main.yml", "tasks/main.yml",
    "tasks/preflight.yml", "tasks/disk.yml", "tasks/label.yml",
])
def test_longhorn_files(rel: str) -> None:
    assert (LH / rel).is_file()


def test_calico_template_has_vxlan_crosszone_fix() -> None:
    text = (CNI / "templates/calico-installation.yaml.j2").read_text()
    # Forensic borrow Section 9.13: VXLAN with MTU and crosssubnet
    assert "VXLAN" in text
    assert "{% if calico_vxlan_crosszone_fix %}" in text


def test_cni_main_branches_on_kube_network_plugin() -> None:
    text = (CNI / "tasks/main.yml").read_text()
    assert "kube_network_plugin == \"calico\"" in text
    assert "kube_network_plugin == \"cilium\"" in text
    assert "kube_network_plugin == \"flannel\"" in text


def test_longhorn_preflight_warns_on_asymmetric_disk() -> None:
    text = (LH / "tasks/preflight.yml").read_text()
    # Forensic borrow Section 9.13: SC zone audit
    assert "asymmetric" in text.lower() or "per-node free disk" in text.lower()


def test_longhorn_fstab_uses_uuid() -> None:
    text = (LH / "tasks/disk.yml").read_text()
    assert "UUID=" in text
