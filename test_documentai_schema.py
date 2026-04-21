import sys
try:
    from google.cloud import documentai
    page = documentai.Document.Page()
    print("Does page have image_block?", hasattr(page, "image_block"))
    print("Does page have image_blocks?", hasattr(page, "image_blocks"))
    print("Does page have visual_elements?", hasattr(page, "visual_elements"))
except ImportError:
    print("documentai not installed")
