variable "name_prefix" {
  type        = string
  description = "Resource-name prefix, e.g. acme."
}

variable "region" {
  type        = string
  description = "Provider-native region ID."
}

variable "env" {
  type        = string
  description = "dev | staging | prod."
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "env must be one of dev, staging, prod."
  }
}

variable "tags" {
  type        = map(string)
  description = "User-supplied tags merged with platform defaults."
  default     = {}
}
