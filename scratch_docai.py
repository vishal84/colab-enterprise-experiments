import sys
from google.cloud import documentai

client = documentai.DocumentProcessorServiceClient()
parent = client.common_location_path("gemini-ent-agent-demos", "us")
try:
    types = client.fetch_processor_types(parent=parent)
    for t in types.processor_types:
        if "LAYOUT" in t.type_ or "IMAGE" in t.type_:
            print(t.type_)
except Exception as e:
    print(e)
