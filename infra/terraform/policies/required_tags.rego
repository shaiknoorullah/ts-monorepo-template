package main

import rego.v1

required_tags := {"managed-by", "env"}

taggable_types := {"hcloud_server", "hcloud_network", "hcloud_firewall", "hcloud_load_balancer", "cloudflare_r2_bucket"}

deny contains msg if {
	some rc in input.resource_changes
	taggable_types[rc.type]
	labels := object.get(rc.change.after, "labels", {})
	present := {k | some k; labels[k]}
	missing := required_tags - present
	count(missing) > 0
	some t in missing
	msg := sprintf("%s is missing required tag %s", [rc.type, t])
}
