from flask import Flask, request, jsonify
import fitz
import io
import os
import base64
import gc
import logging
from PIL import Image
import pytesseract
import zxingcpp

app = Flask(__name__)

# --- Configuration for Bundled Tesseract ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESS_BIN = os.path.join(BASE_DIR, "bin", "tesseract")
TESSDATA = os.path.join(BASE_DIR, "tessdata")

if os.path.exists(TESS_BIN):
    pytesseract.pytesseract.tesseract_cmd = TESS_BIN
    os.environ["TESSDATA_PREFIX"] = TESSDATA
    try:
        os.chmod(TESS_BIN, 0o755)
    except:
        pass

@app.route('/process', methods=['POST'])
def process_pdf():
    try:
        try:
            data = request.get_json(silent=True)
        except:
            data = None
            
        if not data or 'pdf_base64' not in data:
            return jsonify({"error": "Missing pdf_base64 in request body"}), 400

        pdf_bytes = base64.b64decode(data['pdf_base64'])
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        results = {
            "text": "",
            "qr_codes": [],
            "images_count": 0,
            "ocr_text": ""
        }

        # 1. Extract Text
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        results["text"] = full_text.strip()

        # 2. Extract QR Codes and Images
        all_images = []
        for page in doc:
            for img in page.get_images(full=True):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                pil_img = Image.open(io.BytesIO(image_bytes))
                all_images.append(pil_img)
                
                # Try to decode QR from this image using zxingcpp
                try:
                    results_zxing = zxingcpp.read_barcodes(pil_img)
                    for obj in results_zxing:
                        if obj.format in [zxingcpp.BarcodeFormat.QRCode, zxingcpp.BarcodeFormat.DataMatrix]:
                            qr_data = obj.text.strip()
                            if qr_data and qr_data not in results["qr_codes"]:
                                results["qr_codes"].append(qr_data)
                except Exception as e:
                    results["qr_error_internal"] = str(e)

        results["images_count"] = len(all_images)

        # 3. High-Precision OCR
        if len(doc) > 0:
            page = doc[0]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            try:
                ocr_text = pytesseract.image_to_string(img)
                results["ocr_text"] = ocr_text.strip()
            except Exception as e:
                results["ocr_error"] = str(e)

        doc.close()
        gc.collect()

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e), "type": "GlobalCrash"}), 500

@app.route('/')
def home():
    return jsonify({"status": "ok", "worker": "CertiGuard Serverless"})

def handler(request):
    return app(request)

if __name__ == '__main__':
    app.run(debug=True)
