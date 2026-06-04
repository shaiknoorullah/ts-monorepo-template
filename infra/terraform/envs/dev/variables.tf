variable "name_prefix" { type = string }
variable "region" { type = string }
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
  type    = list(any)
  default = []
}
variable "load_balancer" {
  type    = any
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
variable "cloudflare_zone_name" {
  type    = string
  default = ""
}
variable "cloudflare_r2_buckets" {
  type    = list(string)
  default = []
}
