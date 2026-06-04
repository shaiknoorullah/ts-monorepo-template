terraform {
  required_version = ">= 1.9, < 2.0"
  required_providers {
    contabo = {
      source  = "shaiknoorullah/contabo"
      version = "~> 0.1"
    }
    external = {
      source  = "hashicorp/external"
      version = "~> 2.3"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}
