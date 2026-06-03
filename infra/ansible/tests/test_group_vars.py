"""Assert Section 9.8 group_vars surface."""
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def all_vars() -> dict:
    return yaml.safe_load((ROOT / "group_vars/all.yml").read_text())


def test_kube_version_is_pinned(all_vars: dict) -> None:
    assert all_vars["kube_version"] == "1.32.13"


@pytest.mark.parametrize(
    "key,expected",
    [
        ("kube_network_plugin", "calico"),
        ("container_manager", "containerd"),
        ("etcd_deployment_type", "stacked"),
        ("kube_proxy_mode", "iptables"),
        ("ingress_provider", "none"),
        ("pod_cidr", "10.244.0.0/16"),
        ("service_cidr", "10.96.0.0/12"),
        ("wireguard_mesh_enabled", False),
        ("arc_enroll_enabled", False),
        ("uems_enroll_enabled", False),
    ],
)
def test_knob_default(all_vars: dict, key: str, expected: object) -> None:
    assert all_vars[key] == expected, f"{key} default mismatch"


def test_longhorn_label_default(all_vars: dict) -> None:
    assert all_vars["longhorn_node_label"] == {
        "node.longhorn.io/create-default-disk": "true"
    }


def test_extra_args_default_empty(all_vars: dict) -> None:
    assert all_vars["kubelet_extra_args"] == {}
    assert all_vars["apiserver_extra_args"] == {}


def test_cni_plugin_in_allowed_set(all_vars: dict) -> None:
    assert all_vars["kube_network_plugin"] in {"calico", "cilium", "flannel"}


def test_control_plane_group_vars_present() -> None:
    text = (ROOT / "group_vars/control_plane.yml").read_text()
    assert "control_plane_endpoint" in text


def test_workers_group_vars_present() -> None:
    text = (ROOT / "group_vars/workers.yml").read_text()
    assert "longhorn_disk" in text
