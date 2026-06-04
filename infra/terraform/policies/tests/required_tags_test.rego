package main

import rego.v1

import data.main.deny

test_missing_managed_by_tag if {
	some msg in deny with input as {
		"resource_changes": [{
			"type": "hcloud_server",
			"change": {"after": {"labels": {"env": "dev"}}},
		}],
	}
	msg == "hcloud_server is missing required tag managed-by"
}

test_present_managed_by_tag if {
	not has_deny with input as {
		"resource_changes": [{
			"type": "hcloud_server",
			"change": {"after": {"labels": {"managed-by": "ts-monorepo-template", "env": "dev"}}},
		}],
	}
}

has_deny if {
	some _ in deny
}
