project_id = "gemini-ent-agent-demos"
region     = "us-central1"

name_prefix = "colab"
subnet_cidr = "10.10.0.0/20"

routing_mode = "REGIONAL"

nat_ip_allocate_option                     = "AUTO_ONLY"
nat_source_subnetwork_ip_ranges_to_nat     = "ALL_SUBNETWORKS_ALL_IP_RANGES"

allow_internal = true
allow_iap_ssh  = true

allow_egress_internet = true
