terraform {
  required_version = ">= 1.9, < 2.0"
  required_providers {
    hetzner = {
      source  = "panta/hetzner"
      version = "~> 1.0"
    }
  }
}
