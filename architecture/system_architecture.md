# System Architecture

This document describes the high-level architecture of the Colab Enterprise Experiments repository.

## Overview

The system is composed of three main phases: Infrastructure Provisioning, Multimodal Data Processing, and the Search Frontend.

```mermaid
graph TB
    subgraph "Phase 1: Infrastructure (Terraform)"
        VPC["VPC Network"]
        Subnet["Subnetwork"]
        NAT["Cloud NAT"]
        IAM["IAM & API Enablement"]
        Firewall["Firewall Rules"]
    end

    subgraph "Phase 2: Data Pipeline (Colab Enterprise)"
        PDFs[("PDF Files")]
        Gemini["Gemini 2.5 Vision<br/>(Exhibit Extraction)"]
        MuPDF["PyMuPDF<br/>(Masking & Cropping)"]
        DocAI["Document AI<br/>(OCR Extraction)"]
        GCS[("GCS Bucket<br/>(Exhibits & BYOC JSONL)")]
        VertexSearch[("Vertex AI Search<br/>(Data Store & Engine)")]

        PDFs --> Gemini
        Gemini --> MuPDF
        MuPDF --> DocAI
        DocAI --> GCS
        GCS --> VertexSearch
    end

    subgraph "Phase 3: Search Frontend (Next.js)"
        UI["Chat Interface"]
        SearchAPI["/api/search"]
        ImageAPI["/api/image"]

        UI --> SearchAPI
        SearchAPI --> VertexSearch
        UI --> ImageAPI
        ImageAPI --> GCS
    end

    %% Connections between phases
    VPC -.-> PDFs
    VPC -.-> UI
    IAM -.-> Gemini
    IAM -.-> DocAI
    IAM -.-> VertexSearch
```

## Component Details

### 1. Infrastructure (Terraform)
- **VPC & Subnet**: Isolated network environment for Colab Enterprise runtimes.
- **Cloud NAT & Router**: Provides outbound internet access for private runtimes.
- **IAM**: Grants the default Compute Engine service account the necessary permissions for Document AI, Vertex AI, and Cloud Storage.

### 2. Data Pipeline (Notebooks)
- **Spatial Extraction**: Gemini 2.5 identifies charts/graphs and returns bounding boxes.
- **Visual Grounding**: PyMuPDF creates crops of identified exhibits.
- **BYOC Ingestion**: Custom chunks containing text, metadata, and base64 blob images are ingested into Vertex AI Search.

### 3. Frontend (Next.js)
- **Citations**: The Answer API returns grounded citations with references.
- **Image Proxy**: An authenticated API route fetches exhibit images directly from GCS to ensure security.
