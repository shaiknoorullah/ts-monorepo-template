package main

import rego.v1

# Forbid `local` backend in staging/prod plans. Founders working locally
# against dev are fine; staging/prod must use remote state.
deny contains msg if {
	env := input.configuration.root_module.variables.env["default"]
	env != "dev"
	not input.terraform_version
	msg := sprintf("env=%s requires remote state backend (none detected in plan)", [env])
}
