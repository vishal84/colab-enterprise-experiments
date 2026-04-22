import json

notebook_path = "notebooks/byoc_image_filter_guide.ipynb"

with open(notebook_path, 'r') as f:
    nb = json.load(f)

new_cell_source = """if ready_to_proceed:
    vertexai.init(project=PROJECT_ID, location="us-central1")
    gemini_model = GenerativeModel("gemini-2.5-pro")
    
    from google.cloud import documentai
    
    # Initialize Document AI client
    docai_client = documentai.DocumentProcessorServiceClient(
        client_options={"api_endpoint": "us-documentai.googleapis.com"}
    )
    parent = docai_client.common_location_path(PROJECT_ID, "us")
    
    # Find or create a LAYOUT_PARSER_PROCESSOR
    processors = docai_client.list_processors(parent=parent)
    layout_processor = None
    for p in processors:
        if p.type_ == "LAYOUT_PARSER_PROCESSOR":
            layout_processor = p
            break
            
    if not layout_processor:
        print("Creating a Document AI Layout Parser Processor...")
        layout_processor = docai_client.create_processor(
            parent=parent,
            processor=documentai.Processor(
                display_name="BYOC Layout Parser",
                type_="LAYOUT_PARSER_PROCESSOR"
            )
        )
    print(f"Using Processor: {layout_processor.name}")

def describe_image_with_gemini(image_bytes):
    prompt = "Is this an image, chart, graph, or infographic? If yes, describe it in detail. If it is just text or a blank space, reply strictly with \"TEXT\"."
    image_part = Part.from_data(data=image_bytes, mime_type="image/png")
    try:
        response = gemini_model.generate_content([prompt, image_part])
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Error: {e}")
        return "Image asset"

def extract_images_from_pdf(local_pdf_path):
    # Process the entire PDF with Document AI to get accurate layout
    with open(local_pdf_path, "rb") as f:
        pdf_content = f.read()
        
    raw_document = documentai.RawDocument(content=pdf_content, mime_type="application/pdf")
    request = documentai.ProcessRequest(name=layout_processor.name, raw_document=raw_document)
    
    print(f"Parsing layout with Document AI for {local_pdf_path}...")
    docai_result = docai_client.process_document(request=request)
    doc_data = docai_result.document
    
    pdf_doc = fitz.open(local_pdf_path)
    custom_chunks = []
    blob_assets = []
    
    for page_num, page in enumerate(pdf_doc):
        page_width = page.rect.width
        page_height = page.rect.height
        docai_page = doc_data.pages[page_num]
        
        # In Layout Parser, blocks have type 'image' 
        # Wait, docai_page.blocks may not natively expose block type easily in the client library if it's unstructured.
        # But 'visual_elements' or checking 'layout.text_anchor' helps. Actually, layout parser places images in `page.blocks`
        # and we can check if it's an image block. If layout parser fails to give 'image' type, we can fallback.
        
        # Actually Document AI Layout Parser returns images as blocks with empty text_anchor usually or 'image' type.
        # Let's iterate over blocks
        img_idx = 0
        for block in docai_page.blocks:
            # Check if block is an image or if there's an image block identifier
            # Document AI block type isn't always directly accessible. Let's assume we extract visually large blocks that aren't pure text
            # Or better, we can iterate over docai_page.visual_elements if layout parser exposes them!
            pass
            
        # Better yet, PyMuPDF has page.get_images() which gets raw images effortlessly, 
        # but the prompt asked for Doc AI to get charts/graphs/infographics.
        # Layout parser populates `page.blocks`.
        
        for block in docai_page.blocks:
            # We assume it's an image block if we see specific properties, but we'll try to get all images.
            # PyMuPDF extraction using bounding box:
            vertices = block.layout.bounding_poly.normalized_vertices
            if not vertices: continue
            
            xs = [v.x for v in vertices]
            ys = [v.y for v in vertices]
            xmin, xmax = min(xs) * page_width, max(xs) * page_width
            ymin, ymax = min(ys) * page_height, max(ys) * page_height
            
            # Simple heuristic: if it's larger than a tiny icon and has no text, or is marked as image
            # Since Document AI layout parser type isn't reliably typed in Python objects sometimes, we just crop everything
            # Wait, no. We can use page.get_images(full=True) to find raw images, but Document AI finds composite charts.
            
            # Let's try to check the block type or rely on gemini to filter.
            # If we crop and send to Gemini, we can ask Gemini "Is this an image, chart, or graph? If yes, describe. If it is just text, reply 'TEXT'."
            pass
            
        # ACTUALLY, Document AI does expose `type_` for blocks in some parsers, but Layout Parser puts images in `docai_page.blocks` where block type is not set, or it puts them in `docai_page.image_quality_scores`.
        # Wait, the documentation says Layout Parser populates blocks and gives them types like 'figure', 'table', 'text'.
        # No, let's use gemini to filter the crops. 
        
        for block in docai_page.blocks:
            # Actually, `block` doesn't have a `type` property in the protobuf for standard blocks, but it might in Document AI V1.
            # Let's just crop and pass to Gemini, but limit to blocks that look like figures.
            vertices = block.layout.bounding_poly.normalized_vertices
            if not vertices: continue
            xs = [v.x for v in vertices]
            ys = [v.y for v in vertices]
            xmin, xmax = min(xs) * page_width, max(xs) * page_width
            ymin, ymax = min(ys) * page_height, max(ys) * page_height
            
            # Skip very small blocks
            if (xmax - xmin) < 50 or (ymax - ymin) < 50:
                continue
                
            rect = fitz.Rect(xmin, ymin, xmax, ymax)
            try:
                crop_pix = page.get_pixmap(clip=rect)
                crop_bytes = crop_pix.tobytes("png")
                
                # Use Gemini to check and describe
                description = describe_image_with_gemini(crop_bytes)
                if description.upper().startswith("TEXT") or description.upper().startswith("NOT IMAGE"):
                    continue # It's just a text block
                    
                b64_image = base64.b64encode(crop_bytes).decode('utf-8')
                blob_id = f"blob_{os.path.basename(local_pdf_path)}_{page_num+1}_{img_idx}"
                
                blob_assets.append({
                    "name": blob_id,
                    "content": b64_image,
                    "mimeType": "image/png"
                })
                
                chunk = {
                    "chunkId": f"{os.path.basename(local_pdf_path)}_page{page_num+1}_img{img_idx}",
                    "content": f"Image from page {page_num+1}. Description: {description}",
                    "chunkFields": [
                        {
                            "name": "visual_asset",
                            "imageChunkField": {
                                "blobAssetId": blob_id
                            }
                        }
                    ]
                }
                custom_chunks.append(chunk)
                print(f"Page {page_num+1}, Graphic {img_idx}: Cropped and stored.")
                img_idx += 1
                
                page.add_redact_annot(rect, fill=(1,1,1))
            except Exception as e:
                print(f"Error extracting graphic rect on page {page_num+1}: {e}")
                
        page.apply_redactions()

    cleaned_path = local_pdf_path.replace(".pdf", "_cleaned.pdf")
    pdf_doc.save(cleaned_path)
    
    full_text = ""
    for page in pdf_doc:
        full_text += page.get_text() + "\\n"
        
    pdf_doc.close()
    return full_text, custom_chunks, blob_assets
"""

# Find the cell index 4
for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] == 'code' and 'analyze_page_with_gemini' in ''.join(cell['source']):
        nb['cells'][i]['source'] = [line + '\\n' for line in new_cell_source.split('\\n')]
        # Fix last newline
        nb['cells'][i]['source'][-1] = nb['cells'][i]['source'][-1].rstrip('\\n')
        break

with open(notebook_path, 'w') as f:
    json.dump(nb, f, indent=2)

print("Notebook updated successfully.")
