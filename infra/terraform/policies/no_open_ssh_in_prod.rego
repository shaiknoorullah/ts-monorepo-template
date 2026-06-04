package main

import rego.v1

deny contains msg if {
	input.configuration.root_module.variables.env["default"] == "prod"
	some rc in input.resource_changes
	rc.type == "hcloud_firewall"
	some rule in rc.change.after.rule
	rule.direction == "in"
	rule.port == "22"
	"0.0.0.0/0" in rule.source_ips
	msg := "open SSH (port 22 from 0.0.0.0/0) is not permitted in prod firewalls"
}
