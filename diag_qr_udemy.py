import fitz
from PIL import Image
from pyzbar.pyzbar import decode
import io
import os

pdf_path = r"pdfs/Digital Electronics Udemy.pdf"

if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
    exit()

doc = fitz.open(pdf_path)
print(f"Number of pages: {len(doc)}")

for i, page in enumerate(doc):
    print(f"--- Page {i} ---")
    image_list = page.get_images(full=True)
    print(f"Number of images on page: {len(image_list)}")
    
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image = Image.open(io.BytesIO(image_bytes))
        
        # Try to decode QR code from the image
        decoded_objects = decode(image)
        if decoded_objects:
            for obj in decoded_objects:
                print(f"Found QR code: {obj.data.decode('utf-8')}")
        else:
            print(f"No QR code found in image {img_index}")

doc.close()
