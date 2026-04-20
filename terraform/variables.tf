variable "project_id" {
  description = "GCP project ID to deploy into."
  type        = string
}

variable "region" {
  description = "Region for regional resources."
  type        = string
  default     = "us-central1"
}

variable "name_prefix" {
  description = "Prefix used for resource names."
  type        = string
  default     = "colab"
}

variable "routing_mode" {
  description = "Routing mode for the VPC."
  type        = string
  default     = "REGIONAL"

  validation {
    condition     = contains(["REGIONAL", "GLOBAL"], var.routing_mode)
    error_message = "routing_mode must be REGIONAL or GLOBAL."
  }
}

variable "subnet_cidr" {
  description = "Primary CIDR range for the subnetwork."
  type        = string
  default     = "10.10.0.0/20"
}

variable "private_ip_google_access" {
  description = "Enable Private Google Access on the subnetwork."
  type        = bool
  default     = true
}

variable "secondary_ip_ranges" {
  description = "Optional secondary ranges for the subnetwork."
  type = list(object({
    range_name    = string
    ip_cidr_range = string
  }))
  default = []
}

variable "router_asn" {
  description = "BGP ASN for the Cloud Router."
  type        = number
  default     = 64514
}

variable "nat_ip_allocate_option" {
  description = "AUTO_ONLY or MANUAL_ONLY. If MANUAL_ONLY, set nat_ips."
  type        = string
  default     = "AUTO_ONLY"

  validation {
    condition     = contains(["AUTO_ONLY", "MANUAL_ONLY"], var.nat_ip_allocate_option)
    error_message = "nat_ip_allocate_option must be AUTO_ONLY or MANUAL_ONLY."
  }
}

variable "nat_ips" {
  description = "List of external IP self links for MANUAL_ONLY NAT."
  type        = list(string)
  default     = []
}

variable "nat_source_subnetwork_ip_ranges_to_nat" {
  description = "ALL_SUBNETWORKS_ALL_IP_RANGES or LIST_OF_SUBNETWORKS."
  type        = string
  default     = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  validation {
    condition     = contains(["ALL_SUBNETWORKS_ALL_IP_RANGES", "LIST_OF_SUBNETWORKS"], var.nat_source_subnetwork_ip_ranges_to_nat)
    error_message = "nat_source_subnetwork_ip_ranges_to_nat must be ALL_SUBNETWORKS_ALL_IP_RANGES or LIST_OF_SUBNETWORKS."
  }
}

variable "nat_subnetworks" {
  description = "Subnetwork selections for LIST_OF_SUBNETWORKS mode."
  type = list(object({
    name                    = string
    source_ip_ranges_to_nat = list(string)
  }))
  default = []
}

variable "nat_min_ports_per_vm" {
  description = "Minimum ports per VM for NAT."
  type        = number
  default     = 64
}

variable "nat_enable_endpoint_independent_mapping" {
  description = "Enable endpoint independent mapping for NAT."
  type        = bool
  default     = true
}

variable "nat_log_enable" {
  description = "Enable NAT logging."
  type        = bool
  default     = false
}

variable "nat_log_filter" {
  description = "NAT logging filter: ERRORS_ONLY or ALL."
  type        = string
  default     = "ERRORS_ONLY"

  validation {
    condition     = contains(["ERRORS_ONLY", "ALL"], var.nat_log_filter)
    error_message = "nat_log_filter must be ERRORS_ONLY or ALL."
  }
}

variable "create_firewall_rules" {
  description = "Create firewall rules in this module."
  type        = bool
  default     = true
}

variable "allow_internal" {
  description = "Create allow-internal ingress rule."
  type        = bool
  default     = true
}

variable "allow_internal_source_ranges" {
  description = "Ingress source ranges for the allow-internal rule. If empty, uses subnet_cidr."
  type        = list(string)
  default     = []
}

variable "allow_iap_ssh" {
  description = "Create IAP SSH ingress rule."
  type        = bool
  default     = true
}

variable "iap_ssh_source_ranges" {
  description = "Source ranges for IAP SSH."
  type        = list(string)
  default     = ["35.235.240.0/20"]
}

variable "iap_ssh_target_tags" {
  description = "Target tags for IAP SSH rule. If empty, applies to all instances."
  type        = list(string)
  default     = []
}

variable "allow_icmp" {
  description = "Create ICMP ingress rule."
  type        = bool
  default     = false
}

variable "allow_icmp_source_ranges" {
  description = "Source ranges for ICMP ingress rule."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "allow_egress_internet" {
  description = "Create allow-all egress rule to the internet."
  type        = bool
  default     = true
}

variable "egress_destination_ranges" {
  description = "Destination ranges for egress rule."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
