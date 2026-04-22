import json
import base64
import os
import fitz

JSONL_OUTPUT_FILE = "debug_chunks.jsonl"
STAGING_DIR = "notebooks/staging"

def extract_images_from_pdf(local_pdf_path):
    pdf_doc = fitz.open(local_pdf_path)
    custom_chunks = []
    blob_assets = []

    for page_num, page in enumerate(pdf_doc):
        pass # mock gemini

    cleaned_path = local_pdf_path.replace(".pdf", "_cleaned.pdf")
    pdf_doc.save(cleaned_path)
    
    full_text = ""
    for page in pdf_doc:
        full_text += page.get_text() + "\n"
        
    pdf_doc.close()
    return full_text, custom_chunks, blob_assets

all_jsonl_records = []
pdf_files = [f for f in os.listdir(STAGING_DIR) if f.endswith('.pdf') and not f.endswith('_cleaned.pdf')]

for filename in pdf_files:
    local_path = os.path.join(STAGING_DIR, filename)
    full_text, chunks_for_doc, blob_assets = extract_images_from_pdf(local_path)
    
    if full_text.strip():
         chunks_for_doc.append({
             "chunkId": f"{filename}_main_text",
             "content": full_text[:8000] # Break this apart in a real prod scenario if larger
         })

    document_payload = {
         "id": filename.replace(".pdf", "").replace(".", "_").replace(" ", "_"),
         "jsonData": json.dumps({
             "blobAssets": blob_assets,
             "chunkedDocument": {
                 "chunks": chunks_for_doc
             }
         }),
         "content": {
             "mimeType": "text/plain",
             "rawBytes": "RGVtbw=="
         }
    }
    all_jsonl_records.append(document_payload)

with open(JSONL_OUTPUT_FILE, 'w') as f:
    for record in all_jsonl_records:
        f.write(json.dumps(record) + '\n')

with open(JSONL_OUTPUT_FILE, 'r') as f:
    print(f.read())
