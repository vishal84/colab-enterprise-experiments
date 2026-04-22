import fitz

pdf_path = "notebooks/staging/robert-lighthizer-on-the-future-of-global-trade_final.pdf"
doc = fitz.open(pdf_path)

# Apply a dummy redaction to force it to be dirty
page = doc[0]
rect = fitz.Rect(0, 0, 10, 10)
page.add_redact_annot(rect, fill=(1,1,1))
page.apply_redactions()

doc.save("test_cleaned.pdf")

text = ""
for p in doc:
    text += p.get_text()
    
print("Length after save:", len(text.strip()))
