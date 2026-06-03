variables {
  name_prefix = "acme"
  region      = "hel1"
  env         = "dev"
  tags = {
    "cost-center" = "platform"
  }
}

run "tags_merged" {
  command = plan

  assert {
    condition     = output.tags["managed-by"] == "ts-monorepo-template"
    error_message = "expected managed-by tag to be set"
  }

  assert {
    condition     = output.tags["env"] == "dev"
    error_message = "expected env tag to be propagated from variable"
  }

  assert {
    condition     = output.tags["cost-center"] == "platform"
    error_message = "expected user tag to be merged"
  }
}

run "name_for" {
  command = plan

  assert {
    condition     = output.name_for_examples.cp_1 == "acme-dev-cp-1"
    error_message = "expected name_for(cp,1) to equal acme-dev-cp-1"
  }
}
