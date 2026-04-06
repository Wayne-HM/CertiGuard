import fitz
from PIL import Image, ImageOps, ImageEnhance
from pyzbar.pyzbar import decode
import io
import os

pdf_path = r"c:\Users\known\techstorm_nexus\pdfs\Digital Electronics Udemy.pdf"

def try_decode(img, label):
    try:
        decoded = decode(img)
        if decoded:
            for obj in decoded:
                print(f"[{label}] Found: {obj.data.decode('utf-8')}")
            return True
    except:
        pass
    return False

if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
    exit()

doc = fitz.open(pdf_path)
page = doc[0]
image_list = page.get_images()
if not image_list:
    print("No images found.")
    doc.close()
    exit()

xref = image_list[0][0]
base_image = doc.extract_image(xref)
image_bytes = base_image["image"]
original_img = Image.open(io.BytesIO(image_bytes))

found = False

# Try rotations
for angle in [0, 90, 180, 270]:
    rotated = original_img.rotate(angle, expand=True)
    if try_decode(rotated, f"Rotation {angle}"):
        found = True
        break

if not found:
    # Try high contrast + rotation
    gray = ImageOps.grayscale(original_img)
    enhancer = ImageEnhance.Contrast(gray)
    high_contrast = enhancer.enhance(3.0)
    for angle in [0, 180]:
        rotated = high_contrast.rotate(angle, expand=True)
        if try_decode(rotated, f"Rotation {angle} (Contrast)"):
            found = True
            break

if not found:
    print("All rotations and preprocessing failed to find QR code.")

doc.close()
