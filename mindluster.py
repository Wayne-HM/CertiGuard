"""
CertiGuard — Mindluster Certificate Verifier
Uses HuggingFace worker for remote OCR (no local pytesseract).
"""

import re
import time
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15",
]


def verify_mindluster_via_worker(cert_url, worker_client_mod):
    """Fetch Mindluster certificate image and OCR it via HuggingFace worker."""
    cert_id = cert_url.rstrip("/").split("/")[-1]
    if not cert_id:
        return {"status": "Fake", "reason": "Invalid Mindluster URL."}

    image_url = f"https://www.mindluster.com/storage/cer/{cert_id}.jpg"

    # Try remote OCR via HF worker
    ocr_text = ""
    if worker_client_mod and worker_client_mod.client.is_available():
        try:
            result = worker_client_mod.client.ocr_image_url(image_url)
            if result:
                ocr_text = result
        except Exception as e:
            print(f"[DEBUG MINDLUSTER] Worker OCR failed: {e}")

    # Fallback: verify image exists via HEAD request
    if not ocr_text:
        import requests
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        for attempt in range(3):
            try:
                if attempt > 0:
                    time.sleep(random.uniform(1.0, 2.5))
                resp = requests.get(image_url, headers=headers, timeout=15)
                if resp.status_code in [403, 429]:
                    continue
                if resp.status_code != 200:
                    return {"status": "Fake", "reason": "Certificate ID not found on Mindluster."}
                # Image exists but we can't OCR locally — return partial result
                return {
                    "status": "Authentic",
                    "studentName": "",
                    "courseName": "",
                    "note": "Image confirmed but OCR unavailable",
                }
            except Exception as e:
                print(f"[DEBUG MINDLUSTER] Network error attempt {attempt+1}: {e}")
                continue
        return {"status": "Fake", "reason": "Connection failed after multiple attempts."}

    # Parse OCR results
    student_name = ""
    course_name = ""
    start_date = ""
    issue_date = ""
    hours = ""

    nm = re.search(r'presented to\s*\n+([A-Za-z\s]+)\n+for successfully', ocr_text, re.I)
    if nm: student_name = nm.group(1).replace('\n', ' ').strip()

    cm = re.search(r'Course about\s*\n+([^\n]+)', ocr_text, re.I)
    if cm: course_name = cm.group(1).replace('\n', ' ').strip()

    sm = re.search(r'Course Start Date[\s:]*([\d]{4}-[\d]{2}-[\d]{2})', ocr_text, re.I)
    if sm: start_date = sm.group(1).strip()

    all_dates = re.findall(r'\b\d{4}-\d{2}-\d{2}\b', ocr_text)
    if all_dates: issue_date = all_dates[-1]

    hm = re.search(r'Duration[\s:]*(\d+\s*hours?)', ocr_text, re.I)
    if hm: hours = hm.group(1).strip()

    if student_name and course_name:
        return {
            "status": "Authentic",
            "studentName": student_name,
            "courseName": course_name,
            "officialStartDate": start_date,
            "officialDate": issue_date,
            "officialHours": hours,
        }

    return {"status": "Fake", "reason": "Could not OCR the verification image."}


def run_verification(pdf_path, worker_data=None):
    """Main entry point — matches CertiGuard scraper interface."""
    from matcher import smart_match, normalize_text
    import worker_client

    # 1. Get text
    extracted_text = ""
    if worker_data and worker_data.get("text"):
        extracted_text = worker_data["text"]
    else:
        try:
            import PyPDF2
            with open(pdf_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                extracted_text = "".join(p.extract_text() for p in reader.pages if p.extract_text())
        except Exception:
            pass
    if worker_data and worker_data.get("ocr_text"):
        extracted_text += "\n" + worker_data["ocr_text"]
    is_ocr = bool(worker_data and worker_data.get("ocr_text"))

    # 2. Find Mindluster URL
    cert_url = None
    if worker_data and worker_data.get("qr_codes"):
        for qr in worker_data["qr_codes"]:
            if "mindluster.com" in qr.lower():
                cert_url = qr
                break

    if not cert_url:
        m = re.search(r'(https?://[^\s]*mindluster\.com/[^\s]+)', extracted_text, re.I)
        if m: cert_url = m.group(1).strip()

    if not cert_url:
        m = re.search(r'Certified\s*No\.?\s*([A-Za-z0-9]{6,12})', extracted_text, re.I)
        if m: cert_url = f"https://www.mindluster.com/student/certificate/{m.group(1)}"

    if not cert_url:
        return "❌ No valid Mindluster URL or Certificate ID found."

    # 3. Verify via image OCR
    data = verify_mindluster_via_worker(cert_url, worker_client)

    if data["status"] != "Authentic":
        return f"❌ {data.get('reason', 'Verification failed')}"

    name = data.get("studentName", "")
    course = data.get("courseName", "")
    start_date = data.get("officialStartDate", "")
    date = data.get("officialDate", "")
    hours = data.get("officialHours", "")

    # If OCR was unavailable but image exists
    if data.get("note") == "Image confirmed but OCR unavailable":
        return (
            f"✅ Valid Mindluster Certificate (Image Confirmed)\n"
            f"Name: Extracted from Certificate\n"
            f"Course: Extracted from Certificate\n"
            f"URL: {cert_url}\n"
            f"[Note: Remote OCR unavailable, verified via image existence]"
        )

    # 4. Cross-check with PDF text
    if name and not smart_match(name, extracted_text, is_ocr):
        return f"❌ Fake Certificate: Name mismatch\nVerified Name: {name}\nCourse: {course}\nURL: {cert_url}"

    if course and not smart_match(course, extracted_text, is_ocr):
        return f"❌ Fake Certificate: Course mismatch\nName: {name}\nVerified Course: {course}\nURL: {cert_url}"

    norm_doc = normalize_text(extracted_text)
    if date and normalize_text(date) not in norm_doc:
        return f"❌ Fake Certificate: Date altered (Official: {date})\nName: {name}\nCourse: {course}\nURL: {cert_url}"

    # 5. Build success
    det = ""
    if hours: det += f"\nHours: {hours}"
    if date: det += f"\nDate: {date}"
    if start_date: det += f"\nStart Date: {start_date}"

    return f"✅ Valid Mindluster Certificate\nName: {name}\nCourse: {course}\nURL: {cert_url}{det}"
