# Project Context: Colab Enterprise Multimodal Search

This document provides high-level context for AI agents working on this repository. It outlines the core objectives, architecture, and business workflows to ensure all automated actions align with the project's design.

## Core Objective
To build a high-precision, multimodal search pipeline that allows users to query complex documents (PDFs) and receive answers grounded in both text and visual infographics (charts, diagrams, etc.).

## System Architecture

### 1. Infrastructure (Terraform)
*   **Networking:** A secure GCP VPC with dedicated subnetworks.
*   **Connectivity:** Cloud NAT and Router to allow private instances to reach external APIs without public IPs.
*   **Identity:** Least-privilege IAM roles and service accounts to manage interactions between Vertex AI, GCS, and Document AI.

### 2. Multimodal Data Pipeline (The "Business Logic")
The pipeline follows a sophisticated "Bring Your Own Chunks" (BYOC) pattern to overcome standard PDF parsing limitations:
1.  **Ingestion:** PDFs are uploaded to a Google Cloud Storage (GCS) bucket.
2.  **Spatial Analysis:** Gemini 2.5 Vision identifies the exact coordinates (bounding boxes) of infographic exhibits and visual data.
3.  **Visual Processing:** PyMuPDF is used to mask, crop, and save these infographics as standalone image assets in GCS.
4.  **Semantic OCR:** Document AI extracts the text, while Gemini generates semantic descriptions for each visual infographic.
5.  **Indexing:** The final payload—combining text chunks and `blobAssets` (the cropped images)—is ingested into a **Vertex AI Search** v3 Data Store.

### 3. User Experience (Next.js Frontend)
*   **Search Interface:** A modern chat-based UI built with Next.js.
*   **Retrieval:** Users ask questions; the app calls a Search API Proxy that queries Vertex AI Search.
*   **Visual Grounding:** The UI displays visual citations (the infographics) by retrieving them through an authenticated Image API Proxy.

## Technical Stack
*   **Cloud:** Google Cloud Platform (GCP)
*   **AI Models:** Gemini 2.5 Pro/Vision, Vertex AI Search (v3), Document AI
*   **Backend:** Python (Colab Enterprise / Jupyter Notebooks)
*   **Frontend:** Next.js (TypeScript)
*   **Infrastructure:** Terraform
*   **Package Management:** `uv` (Python), `npm` (Frontend)

## Key Directories
*   `/terraform`: Infrastructure as Code.
*   `/notebooks`: Data pipeline experiments and ingestion scripts.
*   `/frontend`: Next.js search application.
*   `/architecture`: High-fidelity diagrams and Miro blueprints.
