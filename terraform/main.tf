locals {
  network_name    = "${var.name_prefix}-vpc"
  subnetwork_name = "${var.name_prefix}-subnet"
  router_name     = "${var.name_prefix}-cr"
  nat_name        = "${var.name_prefix}-nat"

  internal_source_ranges = length(var.allow_internal_source_ranges) > 0 ? var.allow_internal_source_ranges : [var.subnet_cidr]
}

resource "google_compute_network" "vpc" {
  name                    = local.network_name
  auto_create_subnetworks = false
  routing_mode            = var.routing_mode
}

resource "google_compute_subnetwork" "subnet" {
  name                     = local.subnetwork_name
  ip_cidr_range            = var.subnet_cidr
  region                   = var.region
  network                  = google_compute_network.vpc.id
  private_ip_google_access = var.private_ip_google_access

  dynamic "secondary_ip_range" {
    for_each = var.secondary_ip_ranges
    content {
      range_name    = secondary_ip_range.value.range_name
      ip_cidr_range = secondary_ip_range.value.ip_cidr_range
    }
  }
}

resource "google_compute_router" "router" {
  name    = local.router_name
  region  = var.region
  network = google_compute_network.vpc.id

  bgp {
    asn = var.router_asn
  }
}

resource "google_compute_router_nat" "nat" {
  name   = local.nat_name
  router = google_compute_router.router.name
  region = var.region

  nat_ip_allocate_option             = var.nat_ip_allocate_option
  nat_ips                            = var.nat_ip_allocate_option == "MANUAL_ONLY" ? var.nat_ips : null
  source_subnetwork_ip_ranges_to_nat = var.nat_source_subnetwork_ip_ranges_to_nat
  min_ports_per_vm                   = var.nat_min_ports_per_vm
  enable_endpoint_independent_mapping = var.nat_enable_endpoint_independent_mapping

  dynamic "subnetwork" {
    for_each = var.nat_source_subnetwork_ip_ranges_to_nat == "LIST_OF_SUBNETWORKS" ? var.nat_subnetworks : []
    content {
      name                    = subnetwork.value.name
      source_ip_ranges_to_nat = subnetwork.value.source_ip_ranges_to_nat
    }
  }

  dynamic "log_config" {
    for_each = var.nat_log_enable ? [1] : []
    content {
      enable = true
      filter = var.nat_log_filter
    }
  }
}

resource "google_compute_firewall" "allow_internal" {
  count   = var.create_firewall_rules && var.allow_internal ? 1 : 0
  name    = "${var.name_prefix}-allow-internal"
  network = google_compute_network.vpc.id

  direction     = "INGRESS"
  source_ranges = local.internal_source_ranges

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }
}

resource "google_compute_firewall" "allow_iap_ssh" {
  count   = var.create_firewall_rules && var.allow_iap_ssh ? 1 : 0
  name    = "${var.name_prefix}-allow-iap-ssh"
  network = google_compute_network.vpc.id

  direction     = "INGRESS"
  source_ranges = var.iap_ssh_source_ranges
  target_tags   = length(var.iap_ssh_target_tags) > 0 ? var.iap_ssh_target_tags : null

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_firewall" "allow_icmp" {
  count   = var.create_firewall_rules && var.allow_icmp ? 1 : 0
  name    = "${var.name_prefix}-allow-icmp"
  network = google_compute_network.vpc.id

  direction     = "INGRESS"
  source_ranges = var.allow_icmp_source_ranges

  allow {
    protocol = "icmp"
  }
}

resource "google_compute_firewall" "allow_egress_internet" {
  count   = var.create_firewall_rules && var.allow_egress_internet ? 1 : 0
  name    = "${var.name_prefix}-allow-egress-internet"
  network = google_compute_network.vpc.id

  direction          = "EGRESS"
  destination_ranges = var.egress_destination_ranges

  allow {
    protocol = "all"
  }
}

# ------------------------------------------------------------------------------
# API Enabled & Colab Enterprise / Default Compute SA Configuration
# ------------------------------------------------------------------------------

data "google_project" "project" {
  project_id = var.project_id
}

resource "google_project_service" "colab_apis" {
  for_each = toset([
    "aiplatform.googleapis.com",
    "documentai.googleapis.com",
    "discoveryengine.googleapis.com",
    "storage.googleapis.com",
    "compute.googleapis.com"
  ])

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

resource "google_project_iam_member" "compute_sa_roles" {
  for_each = toset([
    "roles/documentai.editor",
    "roles/discoveryengine.editor",
    "roles/aiplatform.user",
    "roles/storage.admin"
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
  
  depends_on = [google_project_service.colab_apis]
}
