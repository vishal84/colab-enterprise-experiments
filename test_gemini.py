import fitz
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import json

vertexai.init(project="gemini-ent-agent-demos", location="us-central1")
# We don't have their project ID. We can't actually query gemini easily without a project ID.
# But we can find the project ID from `gcloud config get-value project` if it were installed.
