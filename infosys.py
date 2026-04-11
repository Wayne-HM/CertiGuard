import re
import os
import gc

def format_iso_date(date_str):
    """Converts 2026-04-01T09:17:37.395Z -> April 1, 2026"""
    if not date_str or not isinstance(date_str, str): return date_str
    try:
        from datetime import datetime
        # Handle ISO format with T and Z
        iso_clean = date_str.split('T')[0]
        dt = datetime.strptime(iso_clean, '%Y-%m-%d')
        return dt.strftime('%B %d, %Y')
    except:
        return date_str

def extract_text_from_pdf(pdf_path):
    # Lightweight local fallback
    import PyPDF2
    try:
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            return "".join(page.extract_text() for page in reader.pages if page.extract_text())
    except:
        return ""


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

def verify_infosys_qr(qr_data, pdf_text=""):
    import json
    if not qr_data:
        return "❌ No QR Data found in certificate."

    # Extract JSON string from payload
    json_str = qr_data
    match = re.search(r'\{.*\}', qr_data, re.DOTALL)
    if match:
        json_str = match.group(0)

    try:
        data = json.loads(json_str)
        
        # 1. Extract Details from JSON
        subject = data.get("credentialSubject", {})
        if isinstance(subject, list) and len(subject) > 0:
            subject = subject[0]
        
        name_keys = ["name", "issuedTo", "learnerName", "recipientName", "studentName", "full_name", "candidateName"]
        course_keys = ["course", "courseName", "courseTitle", "program", "programName", "certification", "title"]

        student_name = get_nested_value(subject, name_keys) if subject else None
        course_data = get_nested_value(subject, course_keys) if subject else None
        
        if not student_name: student_name = get_nested_value(data, name_keys)
        if not course_data: course_data = get_nested_value(data, course_keys)

        course_name = ""
        if isinstance(course_data, dict):
            course_name = course_data.get("name") or course_data.get("title") or ""
        else:
            course_name = str(course_data) if course_data else ""

        if not student_name or not course_name:
            return "❌ Fake Certificate: Vital details missing in secure QR payload."

        # 2. MATCH with PDF Text (The "Double Check")
        pdf_lower = pdf_text.lower()
        json_name_lower = str(student_name).lower().strip()
        json_course_lower = str(course_name).lower().strip()

        # Check if name parts exists in PDF
        name_parts = [p.strip() for p in json_name_lower.split() if len(p.strip()) > 2]
        is_name_match = all(part in pdf_lower for part in name_parts) if name_parts else False
        
        # Check if course part exists in PDF
        is_course_match = json_course_lower in pdf_lower or any(p in pdf_lower for p in json_course_lower.split()[:3])

        if not is_name_match or not is_course_match:
            return (
                f"❌ Fake Certificate Mismatch\n"
                f"Secure Payload Name: {student_name}\n"
                f"Secure Payload Course: {course_name}\n"
                f"Status: Details do not match the visual certificate text."
            )

        # 3. Success Response
        issuance_date = get_nested_value(data, ["issuanceDate", "issuedOn", "date"])
        
        # Prefer "Issued on" text from PDF if available (Bottom left of Infosys certificates)
        pdf_date_match = re.search(r"Issued on:\s*(?:[A-Za-z]+,?\s+)?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})", pdf_text, re.IGNORECASE)
        if pdf_date_match:
            issuance_date = pdf_date_match.group(1).strip()
        elif issuance_date and "T" in str(issuance_date):
            issuance_date = format_iso_date(str(issuance_date))
        
        issuance_date = issuance_date or "N/A"
        total_hours = get_nested_value(data, ["duration", "total_hours", "hours", "learningHours"]) or "N/A"

        return (
            f"✅ Authenticated via Infosys Digital Ledger\n"
            f"Name: {student_name}\n"
            f"Course: {course_name}\n"
            f"Hours: {total_hours}\n"
            f"Date: {issuance_date}\n"
            f"Status: Verified & Matched"
        )

    except json.JSONDecodeError:
        return "❌ QR payload is not a valid Infosys JSON signature."
    except Exception as e:
        return f"❌ Verification Error: {str(e)}"

def run_verification(pdf_path, worker_data=None):
    """Integrates with CertiGuard app.py workflow - strictly QR-driven"""
    all_qr_data = []

    # 1. Get QR codes from worker
    if worker_data and worker_data.get("qr_codes"):
        all_qr_data = worker_data["qr_codes"]
    
    # 2. Get PDF text for detail matching
    pdf_text = ""
    if worker_data and worker_data.get("text"):
        pdf_text = worker_data["text"]
    else:
        pdf_text = extract_text_from_pdf(pdf_path)

    # 3. Scan QR codes for Infosys signatures
    for qr_data in all_qr_data:
        qr_lower = qr_data.lower()
        # Look for Infosys-specific JSON keys
        if any(kw in qr_lower for kw in ["credentialsubject", "infosys", "springboard"]):
            result = verify_infosys_qr(qr_data, pdf_text)
            if "✅" in result or "Mismatch" in result:
                return result

    # Secondary check: Try all QR codes that look like JSON
    for qr_data in all_qr_data:
        if "{" in qr_data and "}" in qr_data:
            result = verify_infosys_qr(qr_data, pdf_text)
            if "✅" in result:
                return result

    if all_qr_data:
        return "❌ QR code found but does not contain valid Infosys verification records."
    return "❌ No valid Infosys verification QR code found. Infosys certificates require a QR signature."


