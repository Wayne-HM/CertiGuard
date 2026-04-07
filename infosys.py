import json
import re
import fitz  # PyMuPDF
from pyzbar.pyzbar import decode
from PIL import Image
import io

def verify_infosys_qr(qr_data):
    if not qr_data:
        return "❌ No QR Data found in certificate."

    # Extract JSON string from payload
    json_str = qr_data
    match = re.search(r'\{.*\}', qr_data, re.DOTALL)
    if match:
        json_str = match.group(0)

    try:
        data = json.loads(json_str)
        
        # Infosys Springboard typically uses a 'credentialSubject' block
        subject = data.get("credentialSubject", {})
        
        # Handle cases where credentialSubject might be a list (common in JSON-LD)
        if isinstance(subject, list) and len(subject) > 0:
            subject = subject[0]

        student_name = subject.get("name") or subject.get("issuedTo") or ""
        course_name = subject.get("course", {}).get("name") if isinstance(subject.get("course"), dict) else subject.get("course")

        # Fallbacks for older/alternate formats
        if not student_name:
            name_keys = ["name", "candidateName", "studentName", "candidate_name", "student_name", "user"]
            student_name = next((data[key] for key in name_keys if key in data), "")
        
        if not course_name:
            course_keys = ["course", "courseName", "title", "course_name", "program", "courseTitle"]
            course_name = next((data[key] for key in course_keys if key in data), "")

        if student_name and course_name:
            return (
                f"✅ Authenticated via Infosys Digital Ledger\n"
                f"Name: {str(student_name).strip()}\n"
                f"Course: {str(course_name).strip()}\n"
                f"Status: Authentic"
            )
        else:
            return "❌ Fake Certificate: Missing vital candidate or course information in secure payload."

    except json.JSONDecodeError:
        return "❌ QR payload is not a valid JSON. Unable to verify digital signature."
    except Exception as e:
        return f"❌ Verification Error: {str(e)}"

def run_verification(pdf_path):
    """Integrates with CertiGuard app.py workflow"""
    try:
        doc = fitz.open(pdf_path)
        
        for page in doc:
            for img in page.get_images(full=True):
                base_image = doc.extract_image(img[0])
                image_bytes = base_image["image"]
                pil_img = Image.open(io.BytesIO(image_bytes))
                
                for obj in decode(pil_img):
                    qr_data = obj.data.decode("utf-8")
                    # Quick check to see if it's likely an Infosys payload
                    if "credentialSubject" in qr_data or "infosys" in qr_data.lower():
                        doc.close()
                        return verify_infosys_qr(qr_data)
        
        doc.close()
        return "❌ No valid Infosys verification QR code found on the certificate."
    except Exception as e:
        return f"❌ Error reading PDF: {str(e)}"
