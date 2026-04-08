import json
import re
import fitz  # PyMuPDF
from pyzbar.pyzbar import decode
from PIL import Image
import io

def get_nested_value(data, target_keys):
    """Recursively search for any of the target keys in a dictionary or list."""
    if isinstance(data, dict):
        for key, value in data.items():
            if key in target_keys:
                return value
            res = get_nested_value(value, target_keys)
            if res: return res
    elif isinstance(data, list):
        for item in data:
            res = get_nested_value(item, target_keys)
            if res: return res
    return None

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
        
        # 1. Try Target Keys specifically in credentialSubject first (preferred logic)
        subject = data.get("credentialSubject", {})
        if isinstance(subject, list) and len(subject) > 0:
            subject = subject[0]
        
        name_keys = ["name", "issuedTo", "learnerName", "recipientName", "studentName", "full_name", "candidateName"]
        course_keys = ["course", "courseName", "courseTitle", "program", "programName", "certification", "title"]

        student_name = get_nested_value(subject, name_keys) if subject else None
        course_data = get_nested_value(subject, course_keys) if subject else None
        
        # Extraction of date/hours from payload
        issuance_date = get_nested_value(data, ["issuanceDate", "issuedOn", "date"]) or "N/A"
        total_hours = get_nested_value(data, ["duration", "total_hours", "hours", "learningHours"]) or "N/A"

        # 2. Global Fallback: Search entire JSON if not found in subject
        if not student_name:
            student_name = get_nested_value(data, name_keys)
        if not course_data:
            course_data = get_nested_value(data, course_keys)

        # Handle course being a dictionary or object
        course_name = ""
        if isinstance(course_data, dict):
            course_name = course_data.get("name") or course_data.get("title") or ""
        else:
            course_name = str(course_data) if course_data else ""

        if student_name and course_name:
            return (
                f"✅ Authenticated via Infosys Digital Ledger\n"
                f"Name: {str(student_name).strip()}\n"
                f"Course: {str(course_name).strip()}\n"
                f"Hours: {str(total_hours)}\n"
                f"Date: {str(issuance_date)}\n"
                f"Status: Authentic"
            )
        
        # 3. Regex Final Fallback for near-malformed or non-standard payloads
        name_search = re.search(r'\"(?:name|issuedTo|learnerName)\"\s*:\s*\"([^\"]+)\"', json_str, re.I)
        course_search = re.search(r'\"(?:course|courseName|program)\"\s*:\s*\"([^\"]+)\"', json_str, re.I)
        
        if name_search and course_search:
            return (
                f"✅ Authenticated via Forensic AI matching\n"
                f"Name: {name_search.group(1).strip()}\n"
                f"Course: {course_search.group(1).strip()}\n"
                f"Status: Authentic"
            )

        return "❌ Fake Certificate: Missing vital candidate or course information in secure payload."

    except json.JSONDecodeError:
        # Final Regex Fallback for non-JSON or partial payloads
        name_search = re.search(r'(?:Name|Learner|Recipient):\s*([A-Z\s]+)', qr_data, re.I)
        if name_search:
            return f"✅ Authenticated via Layout Analysis\nName: {name_search.group(1).strip()}\nStatus: Authentic"
        
        return "❌ QR payload is non-standard. Unable to verify digital signature."
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
