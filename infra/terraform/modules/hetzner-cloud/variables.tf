variable "name_prefix" { type = string }
variable "region" { type = string }
variable "env" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "env must be dev|staging|prod."
  }
}
variable "private_network_cidr" {
  type    = string
  default = "10.50.0.0/24"
}
variable "node_pools" {
  type = list(object({
    role  = string
    count = number
    size  = string
    image = string
    disks = list(object({ mount = string, size_gb = number }))
  }))
}
variable "firewall_rules" {
  type = list(object({
    direction  = string
    protocol   = string
    port       = string
    source_ips = list(string)
  }))
  default = []
}
variable "load_balancer" {
  type = object({
    type      = string
    algorithm = string
  })
  default = null
}
variable "managed_k8s" {
  type    = any
  default = null
}
variable "managed_db" {
  type    = list(any)
  default = []
}
variable "tags" {
  type    = map(string)
  default = {}
}
