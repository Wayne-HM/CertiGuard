import fitz
import re
import os

pdf_path = r"pdfs/Digital Electronics Udemy.pdf"

if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
    exit()

doc = fitz.open(pdf_path)
print(f"Number of pages: {len(doc)}")

for i, page in enumerate(doc):
    print(f"--- Page {i} ---")
    text = page.get_text("text")
    print(f"TEXT MODE:\n'{text}'")
    
    blocks = page.get_text("blocks")
    print(f"BLOCKS MODE (count): {len(blocks)}")
    if blocks:
        for b in blocks[:5]:
            print(f"Block: {b[4]}")

doc.close()
