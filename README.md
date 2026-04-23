# Cymbal Enterprise Search

> **End-to-end multimodal document intelligence** — Extract infographic exhibits from PDFs, ingest them as custom chunks into Vertex AI Search, and query everything through a polished Next.js chat interface with inline image citations.

This project demonstrates a production-ready pipeline for enterprises that need to go beyond basic PDF text search. It combines **Gemini vision models**, **Document AI OCR**, **Vertex AI Search (BYOC)**, and a **Next.js 16 frontend** to deliver grounded, citation-rich answers — complete with the original chart and graph images rendered inline.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Repository Structure](#repository-structure)
- [Phase 1 — Infrastructure (Terraform)](#phase-1--infrastructure-terraform)
  - [1.1 Configure Variables](#11-configure-variables)
  - [1.2 Deploy the Infrastructure](#12-deploy-the-infrastructure)
  - [1.3 What Gets Created](#13-what-gets-created)
  - [1.4 Tear Down](#14-tear-down)
- [Phase 2 — Notebook Pipeline (Colab Enterprise)](#phase-2--notebook-pipeline-colab-enterprise)
  - [2.1 PDF Processing Pipeline](#21-pdf-processing-pipeline)
  - [2.2 BYOC Guide (Reference)](#22-byoc-guide-reference)
- [Phase 3 — Frontend Application](#phase-3--frontend-application)
  - [3.1 Environment Variables](#31-environment-variables)
  - [3.2 Running in Development Mode](#32-running-in-development-mode)
  - [3.3 Running in Production Mode](#33-running-in-production-mode)
- [Environment Variables Reference](#environment-variables-reference)
- [Available Scripts](#available-scripts)
- [Application Architecture](#application-architecture)
  - [Directory Structure](#directory-structure)
  - [Request Lifecycle](#request-lifecycle)
  - [Key Components](#key-components)
  - [API Routes](#api-routes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

- 🔬 **Spatial Exhibit Extraction** — Uses Gemini 2.5 vision models to identify and locate charts, graphs, and infographic exhibits on each PDF page with bounding-box coordinates
- ✂️ **PyMuPDF Masking & Cropping** — Programmatically crops exhibits from PDFs and masks the original pages to isolate text from visuals
- 📝 **Document AI OCR** — Extracts clean page-level text from masked PDFs using Google Cloud Document AI
- 📦 **BYOC Ingestion** — Brings Your Own Chunks into Vertex AI Search with inline base64 blob assets and rich `structData` metadata
- 🔍 **Grounded Answers** — Queries the Vertex AI Search Answer API with Gemini grounding and multimodal corpus image support
- 🖼️ **Inline Visual Citations** — The frontend renders source images (charts, graphs) directly in citation modals alongside extracted text
- 🎛️ **Metadata Filtering** — CEL-based filters for asset type (`chart`, `graph`) and source document
- 🏗️ **Infrastructure as Code** — Terraform scaffolds the entire GCP networking stack (VPC, subnets, Cloud NAT, firewall rules, API enablement, IAM)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        GCP Project                               │
│                                                                  │
│  ┌─────────────┐    ┌────────────────┐    ┌──────────────────┐  │
│  │  Terraform   │───▶│  VPC / NAT /   │    │  IAM / API       │  │
│  │  (Phase 1)   │    │  Firewall      │    │  Enablement      │  │
│  └─────────────┘    └────────────────┘    └──────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            Colab Enterprise Notebook (Phase 2)           │    │
│  │                                                         │    │
│  │  PDF ──▶ Gemini Vision ──▶ PyMuPDF Crop ──▶ Doc AI OCR  │    │
│  │               │                                  │       │    │
│  │               ▼                                  ▼       │    │
│  │         Exhibit Images              Page Text Chunks     │    │
│  │               │                          │               │    │
│  │               └──────────┬───────────────┘               │    │
│  │                          ▼                               │    │
│  │                   BYOC JSONL + GCS                       │    │
│  │                          │                               │    │
│  │                          ▼                               │    │
│  │              Vertex AI Search Data Store                 │    │
│  │              + Search App (Engine)                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Next.js Frontend (Phase 3)                  │    │
│  │                                                         │    │
│  │  User Query ──▶ /api/search ──▶ Answer API (v1alpha)    │    │
│  │                                       │                 │    │
│  │  Chat UI ◀── Annotated Answer + Citations + Images      │    │
│  │                                                         │    │
│  │  Image Proxy ──▶ /api/image ──▶ GCS (authenticated)     │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Infrastructure** | Terraform + Google Provider | `>= 1.3.0` / `>= 5.0.0` |
| **Cloud** | Google Cloud Platform | — |
| **AI / ML** | Gemini 2.5 (Vision), Document AI, Vertex AI Search | v1alpha |
| **Notebook** | Colab Enterprise / Jupyter | Python 3.10+ |
| **Frontend** | Next.js (App Router) | 16.2.4 |
| **UI** | React + Tailwind CSS v4 | 19.2.4 / ^4 |
| **Language** | TypeScript | ^5 |
| **Auth** | Google Auth Library (ADC) | ^10.6.2 |
| **Icons** | Lucide React | ^1.8.0 |

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Minimum Version | How to Install |
|---|---|---|
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) or `brew install node` |
| **npm** | 10+ | Bundled with Node.js |
| **Terraform** | 1.3+ | [terraform.io](https://developer.hashicorp.com/terraform/install) or `brew install terraform` |
| **Google Cloud SDK** | Latest | [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install) or `brew install google-cloud-sdk` |
| **Python** | 3.10+ | Required for notebooks (Colab Enterprise or local Jupyter) |

You also need:

- A **GCP project** with billing enabled
- **Owner** or **Editor** role on the project (to enable APIs and assign IAM roles)
- Authenticated `gcloud` CLI:

  ```bash
  gcloud auth login
  gcloud auth application-default login
  gcloud config set project YOUR_PROJECT_ID
  ```

---

## Repository Structure

```
colab-enterprise-experiments/
├── terraform/                    # Phase 1: Infrastructure as Code
│   ├── main.tf                   # VPC, subnet, NAT, firewall rules, APIs, IAM
│   ├── variables.tf              # All configurable input variables
│   ├── outputs.tf                # Exported resource identifiers
│   ├── versions.tf               # Provider & Terraform version constraints
│   └── terraform.tfvars          # Your project-specific values (git-ignored)
│
├── notebooks/                    # Phase 2: Data processing pipelines
│   ├── pdf_processing_pipeline.ipynb   # Main pipeline: PDF → Exhibits → BYOC → Search
│   ├── byoc_guide.ipynb                # Reference notebook for BYOC ingestion patterns
│   └── staging/                        # Sample PDF documents for processing
│       ├── battery-2030-resilient-sustainable-and-circular.pdf
│       └── robert-lighthizer-on-the-future-of-global-trade_final.pdf
│
├── frontend/                     # Phase 3: Next.js search interface
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Main chat search page
│   │   │   ├── layout.tsx        # Root layout (Inter font, metadata)
│   │   │   ├── globals.css       # Design tokens & custom scrollbar
│   │   │   └── api/
│   │   │       ├── search/route.ts   # Vertex AI Search Answer API proxy
│   │   │       └── image/route.ts    # Authenticated GCS image proxy
│   │   └── components/
│   │       ├── FilterSidebar.tsx      # Metadata filter controls
│   │       ├── GroupedCitation.tsx     # Citation modal with source text + images
│   │       └── MessageBubble.tsx      # Chat message renderer with inline citations
│   ├── .env.local                # Environment variables (git-ignored)
│   ├── package.json              # Dependencies and scripts
│   ├── next.config.ts            # Next.js configuration
│   ├── tsconfig.json             # TypeScript configuration
│   └── postcss.config.mjs        # PostCSS + Tailwind CSS v4
│
├── .gitignore                    # Ignores tfstate, tfvars, node_modules, .next
└── README.md                     # ← You are here
```

---

## Phase 1 — Infrastructure (Terraform)

The Terraform configuration provisions the foundational GCP networking and security infrastructure required by Colab Enterprise notebooks. It also enables the necessary Google Cloud APIs and grants IAM roles to the default Compute Engine service account.

### 1.1 Configure Variables

First, create your `terraform.tfvars` file. This file is git-ignored, so you must create it manually:

```bash
cd terraform
```

Create `terraform.tfvars` with your project-specific values:

```hcl
# Required — your GCP project ID
project_id = "your-gcp-project-id"

# Optional — adjust as needed (defaults shown)
region      = "us-central1"
name_prefix = "colab"
subnet_cidr = "10.10.0.0/20"

# Routing
routing_mode = "REGIONAL"

# NAT Configuration
nat_ip_allocate_option                 = "AUTO_ONLY"
nat_source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

# Firewall Rules
allow_internal        = true
allow_iap_ssh         = true
allow_egress_internet = true
```

<details>
<summary><strong>📋 Full Variable Reference</strong></summary>

| Variable | Type | Default | Description |
|---|---|---|---|
| `project_id` | `string` | **Required** | GCP project ID to deploy into |
| `region` | `string` | `us-central1` | Region for regional resources |
| `name_prefix` | `string` | `colab` | Prefix for all resource names |
| `subnet_cidr` | `string` | `10.10.0.0/20` | Primary CIDR for the subnetwork |
| `routing_mode` | `string` | `REGIONAL` | VPC routing mode (`REGIONAL` or `GLOBAL`) |
| `private_ip_google_access` | `bool` | `true` | Enable Private Google Access on subnet |
| `secondary_ip_ranges` | `list(object)` | `[]` | Optional secondary ranges for the subnet |
| `router_asn` | `number` | `64514` | BGP ASN for the Cloud Router |
| `nat_ip_allocate_option` | `string` | `AUTO_ONLY` | `AUTO_ONLY` or `MANUAL_ONLY` |
| `nat_ips` | `list(string)` | `[]` | External IP self-links (for `MANUAL_ONLY`) |
| `nat_source_subnetwork_ip_ranges_to_nat` | `string` | `ALL_SUBNETWORKS_ALL_IP_RANGES` | NAT scope |
| `nat_min_ports_per_vm` | `number` | `64` | Min NAT ports per VM |
| `nat_log_enable` | `bool` | `false` | Enable NAT logging |
| `nat_log_filter` | `string` | `ERRORS_ONLY` | NAT log filter (`ERRORS_ONLY` or `ALL`) |
| `create_firewall_rules` | `bool` | `true` | Create firewall rules |
| `allow_internal` | `bool` | `true` | Allow internal subnet traffic |
| `allow_iap_ssh` | `bool` | `true` | Allow SSH via IAP (`35.235.240.0/20`) |
| `allow_icmp` | `bool` | `false` | Allow ICMP ingress |
| `allow_egress_internet` | `bool` | `true` | Allow all egress to internet |

</details>

### 1.2 Deploy the Infrastructure

```bash
# Initialize Terraform (downloads the Google provider)
terraform init

# Preview the resources that will be created
terraform plan

# Apply the configuration (creates ~8-10 resources)
terraform apply
```

You will be prompted to confirm. Type `yes` to proceed.

Expected output on success:

```
Apply complete! Resources: 8 added, 0 changed, 0 destroyed.

Outputs:

nat_name         = "colab-nat"
network_name     = "colab-vpc"
network_self_link = "https://www.googleapis.com/compute/v1/projects/…/global/networks/colab-vpc"
router_name      = "colab-cr"
subnetwork_name  = "colab-subnet"
subnetwork_self_link = "https://www.googleapis.com/compute/v1/projects/…/regions/us-central1/subnetworks/colab-subnet"
```

### 1.3 What Gets Created

| Resource | Name | Purpose |
|---|---|---|
| VPC Network | `{prefix}-vpc` | Custom-mode VPC for Colab Enterprise |
| Subnetwork | `{prefix}-subnet` | Regional subnet with Private Google Access |
| Cloud Router | `{prefix}-cr` | Required for Cloud NAT |
| Cloud NAT | `{prefix}-nat` | Outbound internet access for private VMs |
| Firewall (internal) | `{prefix}-allow-internal` | Allow all internal subnet traffic |
| Firewall (IAP SSH) | `{prefix}-allow-iap-ssh` | SSH via Identity-Aware Proxy |
| Firewall (egress) | `{prefix}-allow-egress-internet` | All outbound traffic to `0.0.0.0/0` |
| APIs | 5 APIs enabled | `aiplatform`, `documentai`, `discoveryengine`, `storage`, `compute` |
| IAM | 4 roles | Grants default Compute SA access to Document AI, Discovery Engine, AI Platform, Storage |

### 1.4 Tear Down

To destroy all resources created by Terraform:

```bash
terraform destroy
```

> ⚠️ **Warning**: This will delete the VPC, all firewall rules, Cloud NAT, and remove IAM bindings. Any Colab notebooks running in this network will lose connectivity.

---

## Phase 2 — Notebook Pipeline (Colab Enterprise)

After the infrastructure is deployed, use the Jupyter notebooks to process PDFs, extract exhibits, and ingest everything into Vertex AI Search.

### 2.1 PDF Processing Pipeline

**Notebook**: `notebooks/pdf_processing_pipeline.ipynb`

This is the main pipeline notebook. Upload it to a Colab Enterprise runtime (connected to the VPC created in Phase 1) or run it locally with Jupyter.

#### Pipeline Phases

| Phase | Description | Key Actions |
|---|---|---|
| **Phase 1** | Spatial Extraction with Gemini & PyMuPDF | Sends each PDF page to Gemini vision model to identify exhibits, extracts bounding box coordinates, crops exhibit images, masks original pages |
| **Phase 1b** | Document AI OCR | Sends masked PDFs to Document AI OCR processor for clean page-level text extraction |
| **Phase 2** | Metadata Creation & GCS Upload | Builds BYOC JSONL with `structData`, base64 blob assets, and page text; uploads to GCS |
| **Phase 3** | Vertex AI Search Setup | Creates Data Store + Search Engine, imports BYOC data, enables multimodal retrieval |

#### Running the Notebook

1. **Open the notebook** in Colab Enterprise (or local Jupyter)

2. **Update the configuration cell** (Step 0) with your project values:
   ```python
   PROJECT_ID = "your-gcp-project-id"       # Your GCP project
   LOCATION = "us-central1"                  # Must match Terraform region
   GCS_BUCKET_NAME = "your-bucket-name"      # For exhibit images + JSONL
   DATA_STORE_ID = "your-data-store-id"      # Choose a unique ID
   ENGINE_ID = "your-engine-id"              # Choose a unique ID
   ```

3. **Place your PDF files** in the `notebooks/staging/` directory (two sample PDFs are included)

4. **Run all cells sequentially** — the pipeline takes approximately 10–20 minutes depending on the number of PDFs

5. **Record the output values** — you'll need the `DATA_STORE_ID` and `ENGINE_ID` for the frontend configuration

> **💡 Tip**: The notebook includes optional checkpoint cells that save intermediate results (exhibit metadata, page text) to JSONL files. This lets you skip the expensive Gemini + Document AI phases when iterating on later steps.

### 2.2 BYOC Guide (Reference)

**Notebook**: `notebooks/byoc_guide.ipynb`

A self-contained reference notebook that demonstrates the Bring Your Own Chunks pattern in isolation:

1. Create a Data Store
2. Create a Search App (Engine)
3. Ingest a BYOC document with blob attachments
4. Query using the Answer API and verify visual grounding

Use this notebook to understand the BYOC ingestion format before running the full pipeline.

---

## Phase 3 — Frontend Application

The frontend is a **Next.js 16** application (App Router) with **React 19**, **Tailwind CSS v4**, and **TypeScript**. It provides a conversational search interface that queries Vertex AI Search and renders grounded answers with inline visual citations.

### 3.1 Environment Variables

Navigate to the frontend directory and create your environment file:

```bash
cd frontend
```

Create `.env.local` with the values from Phase 2:

```env
# Required — identifiers from the Vertex AI Search setup
NEXT_PUBLIC_PROJECT_ID="your-gcp-project-id"
NEXT_PUBLIC_LOCATION="global"
NEXT_PUBLIC_DATA_STORE_ID="your-data-store-id"
NEXT_PUBLIC_ENGINE_ID="your-engine-id"
```

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_PROJECT_ID` | ✅ | Your GCP project ID | `gemini-ent-agent-demos` |
| `NEXT_PUBLIC_LOCATION` | ✅ | Discovery Engine location | `global` or `us-central1` |
| `NEXT_PUBLIC_DATA_STORE_ID` | ✅ | Data Store ID created by the notebook | `pdf-pipeline-ds-1776909120` |
| `NEXT_PUBLIC_ENGINE_ID` | ✅ | Search Engine ID created by the notebook | `pdf-pipeline-app-1776909120` |

> **🔑 Authentication**: The backend API routes use **Application Default Credentials (ADC)** via `google-auth-library`. Ensure you have run `gcloud auth application-default login` before starting the server.

### 3.2 Running in Development Mode

```bash
# Install dependencies
npm install

# Start the development server (hot reload enabled)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The dev server features:
- ⚡ Hot Module Replacement (HMR) via Turbopack
- 🔄 Automatic page refresh on file changes
- 📝 Detailed error overlays in the browser
- 🔍 Server-side logs visible in the terminal

### 3.3 Running in Production Mode

```bash
# Build the optimized production bundle
npm run build

# Start the production server
npm run start
```

The production server runs on [http://localhost:3000](http://localhost:3000) by default.

To specify a different port:

```bash
PORT=8080 npm run start
```

To set environment variables for production, you can either:

1. **Use `.env.local`** (same as development — Next.js loads it automatically)
2. **Set shell environment variables** directly:
   ```bash
   NEXT_PUBLIC_PROJECT_ID="prod-project" \
   NEXT_PUBLIC_ENGINE_ID="prod-engine" \
   npm run start
   ```
3. **Use `.env.production`** for production-specific overrides:
   ```bash
   cp .env.local .env.production
   # Edit .env.production with production values
   ```

---

## Environment Variables Reference

### Terraform Variables (`terraform/terraform.tfvars`)

| Variable | Required | Description |
|---|---|---|
| `project_id` | ✅ | GCP project ID |
| `region` | ❌ | GCP region (default: `us-central1`) |
| `name_prefix` | ❌ | Resource naming prefix (default: `colab`) |
| `subnet_cidr` | ❌ | Subnet CIDR range (default: `10.10.0.0/20`) |

### Notebook Configuration (Step 0 cell)

| Variable | Required | Description |
|---|---|---|
| `PROJECT_ID` | ✅ | GCP project ID (must match Terraform) |
| `LOCATION` | ✅ | GCP region for Vertex AI resources |
| `GCS_BUCKET_NAME` | ✅ | Bucket for exhibit images and BYOC JSONL |
| `DATA_STORE_ID` | ✅ | Chosen ID for the Vertex AI Search Data Store |
| `ENGINE_ID` | ✅ | Chosen ID for the Vertex AI Search Engine |

### Frontend Variables (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_PROJECT_ID` | ✅ | GCP project ID |
| `NEXT_PUBLIC_LOCATION` | ✅ | Discovery Engine location (`global` or region) |
| `NEXT_PUBLIC_DATA_STORE_ID` | ✅ | Data Store ID from notebook output |
| `NEXT_PUBLIC_ENGINE_ID` | ✅ | Engine ID from notebook output |

---

## Available Scripts

### Frontend (`frontend/`)

| Command | Description |
|---|---|
| `npm run dev` | Start development server with HMR (Turbopack) |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint code quality checks |

### Terraform (`terraform/`)

| Command | Description |
|---|---|
| `terraform init` | Initialize providers and download plugins |
| `terraform plan` | Preview infrastructure changes |
| `terraform apply` | Create/update infrastructure |
| `terraform destroy` | Tear down all managed resources |
| `terraform output` | Display current output values |
| `terraform fmt` | Format `.tf` files |
| `terraform validate` | Check configuration syntax |

---

## Application Architecture

### Directory Structure

```
frontend/src/
├── app/
│   ├── page.tsx              # SearchChat — main conversational search page
│   ├── layout.tsx            # RootLayout — Inter font, HTML metadata
│   ├── globals.css           # Design tokens, scrollbar, Tailwind theme
│   └── api/
│       ├── search/route.ts   # POST /api/search — Vertex AI Search Answer API
│       └── image/route.ts    # GET /api/image?path=gs://… — GCS image proxy
└── components/
    ├── FilterSidebar.tsx     # Metadata filter panel (type + source file)
    ├── GroupedCitation.tsx    # Citation modal with exhibits and text
    └── MessageBubble.tsx     # Chat message with inline bold + citation rendering
```

### Request Lifecycle

```
User types query
       │
       ▼
SearchChat (page.tsx) — client component
       │
       │  POST /api/search  { query, filter? }
       ▼
search/route.ts — server-side API route
       │
       │  1. Authenticate via ADC (google-auth-library)
       │  2. Build Answer API payload with multimodalSpec
       │  3. POST to Discovery Engine v1alpha :answer endpoint
       ▼
Vertex AI Search Answer API
       │
       │  Returns: answerText, citations[], references[]
       ▼
search/route.ts — parse and forward
       │
       ▼
SearchChat — processes response
       │
       │  1. Build sourcesMap from references (chunks, blobs, structData)
       │  2. Insert inline [N] citation markers at correct text positions
       │  3. Render via MessageBubble → GroupedCitation
       ▼
User sees answer with clickable citation badges
       │
       │  Click [1 source] badge → SourceModal opens
       │  Modal shows: excerpt text, source file, page number, exhibit image
       │
       │  Images loaded via /api/image?path=gs://… proxy
       ▼
image/route.ts — authenticated GCS fetch
       │  Parses gs:// path → GCS JSON API → proxied binary response
```

### Key Components

**`SearchChat`** (`page.tsx`)
- Client component managing chat state, input, and filter controls
- Builds CEL filter expressions from sidebar state
- Processes Answer API response into annotated text with citation markers

**`FilterSidebar`** (`FilterSidebar.tsx`)
- Toggle for "Charts & Graphs Only" — appends `type: ANY("chart", "graph")` to CEL filter
- Text input for source file filtering — appends `source_file: ANY(...)` to CEL filter

**`MessageBubble`** (`MessageBubble.tsx`)
- Renders user messages in bordered bubbles (right-aligned)
- Renders model messages with bot avatar, bold text parsing, and grouped citation badges

**`GroupedCitation`** (`GroupedCitation.tsx`)
- Inline citation badge (e.g., `[1 source]`) that opens a full-screen modal
- Modal displays: source text excerpt, `structData` metadata (file, page), BYOC blob images, or GCS exhibit images via the `/api/image` proxy

### API Routes

**`POST /api/search`**
- Accepts: `{ query: string, filter?: string }`
- Authenticates via Application Default Credentials
- Calls Discovery Engine v1alpha `servingConfigs:answer` with multimodal + citation support
- Returns the raw Answer API response (answer text, citations, references with blob attachments)

**`GET /api/image?path=gs://bucket/path`**
- Accepts a `gs://` path as a query parameter
- Authenticates with ADC and fetches the object from GCS via the JSON API
- Proxies the binary image response with correct MIME type and 1-hour cache headers
- Supports PNG, JPEG, WebP, GIF, and SVG

---

## Troubleshooting

### Authentication Errors

**Error**: `Could not get GCP Credentials`

```bash
# Ensure you are authenticated with Application Default Credentials
gcloud auth application-default login
```

**Error**: `UNABLE_TO_GET_ISSUER_CERT`

This can occur in notebook environments with custom certificate stores:
```bash
# Set the CA bundle path (if using a corporate proxy or custom certs)
export REQUESTS_CA_BUNDLE=/path/to/ca-bundle.crt
```

### Terraform Errors

**Error**: `Error 403: Required permission for project`

Ensure your account has Owner or Editor role:
```bash
gcloud projects get-iam-policy YOUR_PROJECT_ID --format="table(bindings.role)"
```

**Error**: `API not enabled`

Terraform enables APIs automatically, but if they fail:
```bash
gcloud services enable aiplatform.googleapis.com discoveryengine.googleapis.com \
  documentai.googleapis.com storage.googleapis.com compute.googleapis.com
```

### Frontend Errors

**Error**: `Please configure NEXT_PUBLIC_ENGINE_ID in .env.local`

Create the `.env.local` file with correct values from Phase 2:
```bash
cp frontend/.env.local.example frontend/.env.local
# Or create manually with the four required variables
```

**Error**: `Discovery Engine Error: 404`

Verify your Engine ID and Data Store ID are correct. They are printed in the notebook output after the Vertex AI Search setup phase.

**Error**: `Image proxy: GCS fetch failed (403)`

The default Compute SA needs `roles/storage.admin` (granted by Terraform). If running locally, ensure your ADC account has `Storage Object Viewer` on the GCS bucket.

### Port Conflicts

If port 3000 is already in use:

```bash
# Find and kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Or run on a different port
PORT=3001 npm run dev
```

### Node.js Version Issues

If you see build errors related to React 19 or Next.js 16:

```bash
# Verify your Node.js version (must be 20+)
node --version

# If needed, upgrade via nvm
nvm install 20
nvm use 20
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is provided as-is for demonstration and experimentation purposes.
