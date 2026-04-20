output "network_name" {
  value = google_compute_network.vpc.name
}

output "network_self_link" {
  value = google_compute_network.vpc.self_link
}

output "subnetwork_name" {
  value = google_compute_subnetwork.subnet.name
}

output "subnetwork_self_link" {
  value = google_compute_subnetwork.subnet.self_link
}

output "router_name" {
  value = google_compute_router.router.name
}

output "nat_name" {
  value = google_compute_router_nat.nat.name
}
