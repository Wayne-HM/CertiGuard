"""
CertiGuard HuggingFace Worker
=============================
Lightweight PDF processing service — text extraction + QR decoding.
Image/OCR processing is DISABLED to reduce memory and startup time.

Deploy as a HuggingFace Space (Docker SDK).

Endpoints:
  POST /process        — PDF base64 → { text, qr_codes }
  GET  /health         — Health check
"""

import os
import base64
import traceback

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

import fitz  # PyMuPDF
import cv2
import numpy as np
from pyzbar.pyzbar import decode as decode_qr

# ============================================================
# App Init
# ============================================================

app = FastAPI(title="CertiGuard Worker", version="3.0-lite")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🚀 CertiGuard Worker v3.0-lite starting (Image processing DISABLED)")

# ============================================================
# Request / Response Models
# ============================================================

class ProcessRequest(BaseModel):
    pdf_base64: str

class ProcessResponse(BaseModel):
    text: str = ""
    ocr_text: str = ""
    qr_codes: List[str] = []
    images_count: int = 0

# ============================================================
# Core Logic
# ============================================================

def extract_qr_from_image(img_array: np.ndarray) -> List[str]:
    """Decode QR codes from a numpy image array."""
    qr_results = []
    try:
        decoded = decode_qr(img_array)
        for obj in decoded:
            data = obj.data.decode("utf-8", errors="ignore")
            if data:
                qr_results.append(data)
    except Exception as e:
        print(f"  QR decode error: {e}")

    # Fallback: try grayscale + threshold if no results
    if not qr_results:
        try:
            gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY) if len(img_array.shape) == 3 else img_array
            _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
            decoded = decode_qr(thresh)
            for obj in decoded:
                data = obj.data.decode("utf-8", errors="ignore")
                if data:
                    qr_results.append(data)
        except Exception:
            pass

    return qr_results


def process_pdf_bytes(pdf_bytes: bytes) -> dict:
    """PDF processing: native text extraction + QR scanning. No OCR."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    native_text = ""
    all_qr_codes = []
    images_count = 0

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)

        # 1. Native text extraction
        page_text = page.get_text()
        native_text += page_text + " \n "

        # 2. Render page to image for QR code scanning only
        mat = fitz.Matrix(2.0, 2.0)  # 2x zoom (lower than before since no OCR)
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        img_array = np.frombuffer(img_data, dtype=np.uint8)
        img_array = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img_array is None:
            continue

        images_count += 1

        # 3. QR code extraction
        qr_codes = extract_qr_from_image(img_array)
        all_qr_codes.extend(qr_codes)

        # IMAGE OCR DISABLED — relying on native text extraction only

    doc.close()

    # Deduplicate QR codes
    unique_qr = list(dict.fromkeys(all_qr_codes))

    return {
        "text": native_text.strip(),
        "ocr_text": "",  # OCR disabled
        "qr_codes": unique_qr,
        "images_count": images_count,
    }


# ============================================================
# Endpoints
# ============================================================

@app.post("/process", response_model=ProcessResponse)
async def process_pdf(request: ProcessRequest):
    """Process a base64-encoded PDF: extract text and QR codes."""
    try:
        pdf_bytes = base64.b64decode(request.pdf_base64)
        print(f"📄 Processing PDF ({len(pdf_bytes) / 1024:.1f} KB)")

        result = process_pdf_bytes(pdf_bytes)

        print(f"✅ Done: {len(result['text'])} chars text, "
              f"{len(result['qr_codes'])} QR codes")

        return ProcessResponse(**result)

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "CertiGuard Worker",
        "version": "3.0-lite",
        "image_processing": False,
    }


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
