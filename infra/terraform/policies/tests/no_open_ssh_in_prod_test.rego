package main

import rego.v1

import data.main.deny

test_open_ssh_in_prod_blocked if {
	some msg in deny with input as {
		"configuration": {"root_module": {"variables": {"env": {"default": "prod"}}}},
		"resource_changes": [{
			"type": "hcloud_firewall",
			"change": {"after": {"rule": [{"direction": "in", "port": "22", "source_ips": ["0.0.0.0/0"]}]}},
		}],
	}
	contains(msg, "open SSH (port 22 from 0.0.0.0/0) is not permitted in prod")
}

test_open_ssh_in_dev_allowed if {
	# Fixture includes the platform-required labels so the only candidate
	# deny is the SSH rule itself — which is permitted in dev.
	not has_deny_ssh with input as {
		"configuration": {"root_module": {"variables": {"env": {"default": "dev"}}}},
		"resource_changes": [{
			"type": "hcloud_firewall",
			"change": {"after": {
				"labels": {"managed-by": "ts-monorepo-template", "env": "dev"},
				"rule": [{"direction": "in", "port": "22", "source_ips": ["0.0.0.0/0"]}],
			}},
		}],
	}
}

has_deny_ssh if {
	some _ in deny
}
