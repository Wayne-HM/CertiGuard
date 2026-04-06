import fitz
from PIL import Image
import io

pdf_path = r"pdfs/Digital Electronics Udemy.pdf"
doc = fitz.open(pdf_path)
page = doc[0]
image_list = page.get_images(full=True)
if image_list:
    xref = image_list[0][0]
    base_image = doc.extract_image(xref)
    image_bytes = base_image["image"]
    with open("udemy_temp_qr.png", "wb") as f:
        f.write(image_bytes)
    print("Saved image to udemy_temp_qr.png")
else:
    print("No images found, rendering page...")
    pix = page.get_pixmap(matrix=fitz.Matrix(4, 4))
    pix.save("udemy_temp_page.png")
    print("Saved page to udemy_temp_page.png")
doc.close()
