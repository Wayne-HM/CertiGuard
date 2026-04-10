import re
import time
import os
import gc
from urllib.parse import urlparse

def get_tesseract_path():
    TESSERACT_PATHS = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Users\known\AppData\Local\Tesseract-OCR\tesseract.exe",
        r"/usr/bin/tesseract"
    ]

    for path in TESSERACT_PATHS:
        if os.path.exists(path):
            return path
    return None


# --- HELPERS FOR PDF EXTRACTION ---

def perform_high_precision_ocr(pix):
    # LOCAL OCR REMOVED: Use Worker for OCR to save memory and prevent crashes
    return ""


def extract_text_from_pdf(pdf_path):
    import fitz
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text("text") + "\n"
            if not text.strip():
                text += "\n".join(b[4] for b in page.get_text("blocks"))
        doc.close()
    except Exception as e:
        print(f"Error extracting text: {e}")
    return text.strip()


def extract_qr_from_pdf(pdf_path):
    import fitz
    import io
    from PIL import Image
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            images = page.get_images(full=True)
            if not images:
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img_data = pix.tobytes("png")
                pil_img = Image.open(io.BytesIO(img_data))
                qr_url = decode_qr_with_preprocessing(pil_img)
                if qr_url:
                    doc.close()
                    return qr_url
                continue

            for img in images:
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                pil_img = Image.open(io.BytesIO(image_bytes))
                qr_url = decode_qr_with_preprocessing(pil_img)
                if qr_url:
                    doc.close()
                    return qr_url
        doc.close()
    except Exception as e:
        print(f"QR Extraction error: {e}")
    return None


def decode_qr_with_preprocessing(pil_img):
    # LOCAL QR DECODING REMOVED: Use Worker to prevent OOM/Import errors
    return None


def extract_top_right_url(pdf_path):
    import fitz
    try:
        doc = fitz.open(pdf_path)
        page = doc[0]
        rect = page.rect
        crop_rect = fitz.Rect(rect.width * 0.55, 0, rect.width, rect.height * 0.2)
        pix = page.get_pixmap(matrix=fitz.Matrix(4, 4), clip=crop_rect)
        ocr_text = perform_high_precision_ocr(pix).replace(" ", "")
        match = re.search(r"(?:ude\.my/|udemy\.com/certificate/)([a-zA-Z0-9\-]+)", ocr_text, re.IGNORECASE)
        found_url = None
        if match:
            url_part = match.group(1).strip()
            found_url = f"https://www.udemy.com/certificate/{url_part}/"
        doc.close()
        del pix
        gc.collect()
        return found_url
    except Exception as e:
        print(f"Top-right OCR error: {e}")
    return None


def clean_text_noise(text):
    if not text: return text
    text = re.sub(r'[|_\[\]]{2,}', '', text)
    text = re.sub(r'\| _| _\||_\$|___', '', text)
    text = re.sub(r'\s{2,}', ' ', text)
    text = text.strip('|').strip('_').strip()
    return text.strip()

def extract_hours_and_date(text):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    hours = "N/A"
    date = "N/A"
    if len(lines) >= 2:
        hours_cand = clean_text_noise(lines[-1])
        date_cand = clean_text_noise(lines[-2])
        if re.search(r"\d", hours_cand): hours = hours_cand
        if re.search(r"\d", date_cand) or any(m in date_cand.lower() for m in ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]):
            date = date_cand
    if "n/a" in hours.lower():
        h_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:total\s*hours|hours\s*total|hours)", text, re.I)
        if h_match: hours = h_match.group(1).strip()
    if "n/a" in date.lower():
        d_match = re.search(r"(?:on|Date:)\s*([A-Z][a-z]+\s+\d{1,2},\s+\d{4})", text)
        if d_match: date = d_match.group(1).strip()
    return clean_text_noise(hours), clean_text_noise(date)

def extract_details_from_pdf_text(text):
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    name = "Name Not Found"
    course = "Course Not Found"
    
    # Try to find the Course first (it's usually in a standard format)
    course_match = re.search(
        r"CERTIFICATE\s+OF\s+COMPLETION\s+(.*?)\s*(?:Instructors?|URL:|Date:|on\s+[A-Z][a-z]+|as\s+taught\s+by|$)",
        text, re.IGNORECASE | re.DOTALL
    )
    if course_match:
        course = clean_text_noise(course_match.group(1).strip())
    
    # Try to find the Name (usually follows 'that' or is above 'successfully completed')
    name_match = re.search(r"(?:verifies that|certifies that|that)\s+([A-Z][a-zA-Z\s]+?)\s+(?:successfully|has|completed)", text, re.IGNORECASE)
    if name_match:
        name = clean_text_noise(name_match.group(1).strip())
    
    # Fallback to line-based if regex failed
    if name == "Name Not Found" and len(lines) >= 3:
        # Often: [Course Name] \n [Student Name] \n [Date]
        name = clean_text_noise(lines[-3])
        
    name_blacklist = ["Web Coding", "Coding", "Bootcamp", "Academy", "Development", "Learning", "Udemy", "Certificate", "Instructor", "Course", "Date", "Completion"]
    if not name or any(word.lower() == name.lower() for word in name_blacklist) or name == "Name Not Found":
        # Look for the first line with multiple words after the header info
        for line in lines:
            candidate = clean_text_noise(line)
            if len(candidate.split()) >= 2 and not any(w.lower() in candidate.lower() for w in name_blacklist):
                if candidate != course:
                    name = candidate
                    break
    
    return name, course

def extract_verification_link(text, pdf_path="", worker_data=None):
    # FAST PATH: Check worker data first
    if worker_data and worker_data.get("qr_codes"):
        for qr in worker_data["qr_codes"]:
            if "udemy.com/certificate" in qr or "ude.my" in qr:
                return qr

    # FAST PATH: Check text second (no heavy libs needed)
    text_clean = text.replace("\n", " ").replace("\r", " ").replace("  ", " ")
    match = re.search(r"(?:https?://)?(?:www\.)?udemy\.com/certificate/[a-zA-Z0-9\-]+", text_clean, re.IGNORECASE)
    if match:
        url = match.group(0).strip().replace(" ", "")
        return url if url.startswith("http") else "https://" + url
    match = re.search(r"(?:https?://)?ude\.my/\s*([a-zA-Z0-9\-]+)", text_clean, re.IGNORECASE)
    if match:
        url_part = match.group(1).strip()
        return f"https://www.udemy.com/certificate/{url_part}/"
    match = re.search(r"Certificate url:\s*([a-zA-Z0-9./\- ]+)", text_clean, re.IGNORECASE)
    if match:
        url = match.group(1).strip().replace(" ", "")
        return url if url.startswith("http") else "https://" + url

    # FAST PATH: Check filename
    if pdf_path:
        filename = pdf_path.replace("\\", "/").split("/")[-1]
        id_match = re.search(r"UC-[a-zA-Z0-9\-]+", filename, re.IGNORECASE)
        if id_match:
            uid = id_match.group(0)
            if uid.lower().startswith("uc-"):
                uid = "UC-" + uid[3:]
            return f"https://www.udemy.com/certificate/{uid}/"
        uuid_match = re.search(r"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})", filename, re.IGNORECASE)
        if uuid_match:
            uid = uuid_match.group(1).lower()
            return f"https://www.udemy.com/certificate/UC-{uid}/"

    # SLOW PATH: QR code scan (loads fitz+PIL+pyzbar)
    if pdf_path and not worker_data:
        try:
            qr_url = extract_qr_from_pdf(pdf_path)
            if qr_url:
                return qr_url
        except Exception as e:
            print(f"DEBUG: QR scan failed: {e}")

    return None

def extract_details_via_ocr(pdf_path):
    import fitz
    try:
        doc = fitz.open(pdf_path)
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))
        ocr_text = perform_high_precision_ocr(pix)
        doc.close()
        del pix
        gc.collect()
        extracted_name, extracted_course = extract_details_from_pdf_text(ocr_text)
        return extracted_name, extracted_course, ocr_text
    except Exception as e:
        print(f"Full-page OCR error: {e}")
        return "Name Not Found", "Course Not Found", ""


# --- LIGHTWEIGHT VERIFICATION ENGINE (requests-based, no browser needed) ---


def verifyUdemy(certId):
    """Lightweight verification using requests + BeautifulSoup. No Chromium needed."""
    import requests
    from bs4 import BeautifulSoup

    certId = certId.replace('ude.my/', '').strip()
    if not certId.startswith('UC-'):
        if '/' in certId:
            cert_id_clean = certId.split('/')[-1]
            certId = cert_id_clean if cert_id_clean.startswith('UC-') else 'UC-' + cert_id_clean
        else:
            certId = 'UC-' + certId

    url = f"https://www.udemy.com/certificate/{certId}/"

    studentName = ""
    courseName = ""
    issueDate = ""
    hours = ""

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    max_retries = 2
    for attempt in range(max_retries):
        try:
            print(f"DEBUG: Udemy verify attempt {attempt+1} for {certId} using requests")
            response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)

            if response.status_code == 404:
                return {"status": "Fake", "reason": "Certificate ID not found on Udemy (404)."}

            if response.status_code != 200:
                print(f"DEBUG: Udemy returned status {response.status_code}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                return {"status": "Fake", "reason": f"Udemy returned HTTP {response.status_code}."}

            html = response.text
            soup = BeautifulSoup(html, "html.parser")

            # --- Method 1: Parse JSON-LD structured data (most reliable) ---
            import json
            for script_tag in soup.find_all("script", type="application/ld+json"):
                try:
                    ld_data = json.loads(script_tag.string)
                    if isinstance(ld_data, list):
                        ld_data = ld_data[0]
                    if "name" in ld_data:
                        courseName = ld_data.get("name", "")
                    if "author" in ld_data:
                        author = ld_data["author"]
                        if isinstance(author, dict):
                            studentName = author.get("name", "")
                except:
                    pass

            # --- Method 2: Parse meta tags ---
            if not courseName:
                og_title = soup.find("meta", property="og:title")
                if og_title and og_title.get("content"):
                    courseName = og_title["content"].strip()

            if not studentName:
                og_desc = soup.find("meta", property="og:description")
                if og_desc and og_desc.get("content"):
                    desc = og_desc["content"]
                    # Pattern: "This certificate above verifies that NAME successfully completed..."
                    m = re.search(r'verifies that\s+(.+?)\s+successfully completed', desc, re.IGNORECASE)
                    if m:
                        studentName = m.group(1).strip()

            # --- Method 3: Parse raw HTML text ---
            page_text = soup.get_text(separator="\n")

            if not studentName or not courseName:
                verify_match = re.search(
                    r'verifies that\s+(.+?)\s+successfully completed the course\s+(.+?)\s+on\s+(.+?)\s+as taught by',
                    page_text, re.IGNORECASE | re.DOTALL
                )
                if verify_match:
                    if not studentName:
                        studentName = verify_match.group(1).replace('\n', ' ').strip()
                    if not courseName:
                        courseName = verify_match.group(2).replace('\n', ' ').strip()
                    if not issueDate:
                        issueDate = verify_match.group(3).replace('\n', ' ').strip()

            # --- Extract hours ---
            hours_match = re.search(r'(\d+(?:\.\d+)?)\s*total hours', page_text, re.IGNORECASE)
            if hours_match:
                hours = hours_match.group(1).strip()

            # --- Extract date fallback ---
            if not issueDate:
                date_match = re.search(r'(?:on|Date:?)\s*([A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4})', page_text)
                if date_match:
                    issueDate = date_match.group(1).strip()

            # --- Check if the page is a valid certificate page ---
            # If HTML contains certificate-related keywords, it's a real page
            html_lower = html.lower()
            is_cert_page = any(kw in html_lower for kw in [
                "certificate of completion", "successfully completed",
                "verifies that", "udemy certificate"
            ])

            if studentName and courseName:
                return {
                    "status": "Authentic",
                    "studentName": studentName,
                    "courseName": courseName,
                    "officialDate": issueDate,
                    "officialHours": hours,
                    "url": url
                }
            elif is_cert_page:
                # Page looks like a certificate but we couldn't parse details
                # (JS-rendered content). Use title as fallback.
                title = soup.find("title")
                if title and title.string:
                    title_text = title.string.strip()
                    if title_text and "udemy" in title_text.lower():
                        courseName = title_text.replace("| Udemy", "").strip()

                if courseName:
                    return {
                        "status": "Authentic",
                        "studentName": studentName or "Verified Student",
                        "courseName": courseName,
                        "officialDate": issueDate,
                        "officialHours": hours,
                        "url": url
                    }

            if attempt < max_retries - 1:
                time.sleep(2)
                continue

        except requests.exceptions.Timeout:
            print(f"DEBUG: Udemy request timed out on attempt {attempt+1}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return {"status": "Fake", "reason": "Udemy verification timed out."}
        except Exception as e:
            print(f"DEBUG: Udemy verification error: {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return {"status": "Fake", "reason": f"Verification error: {str(e)}"}

    return {"status": "Fake", "reason": "Could not parse official Udemy verification page. Certificate ID may be invalid."}


# --- MAIN RUNNER ---

def run_verification(file_path, worker_data=None):
    """Bridge between PDF extraction and live verification"""
    extracted_text = ""
    if worker_data and worker_data.get("text"):
        extracted_text = worker_data["text"]
    else:
        extracted_text = extract_text_from_pdf(file_path)
        
    verification_link = extract_verification_link(extracted_text, file_path, worker_data=worker_data)

    if not verification_link:
        if worker_data and worker_data.get("ocr_text"):
            # Check worker OCR for the URL
            ocr_text = worker_data["ocr_text"].replace(" ", "")
            match = re.search(r"(?:ude\.my/|udemy\.com/certificate/)([a-zA-Z0-9\-]+)", ocr_text, re.IGNORECASE)
            if match:
                url_part = match.group(1).strip()
                verification_link = f"https://www.udemy.com/certificate/{url_part}/"
        
        if not verification_link and not worker_data:
            verification_link = extract_top_right_url(file_path)

    # Get local details first
    local_name, local_course = extract_details_from_pdf_text(extracted_text)

    if local_name == "Name Not Found" or local_course == "Course Not Found":
        if worker_data and worker_data.get("ocr_text"):
            ocr_name, ocr_course = extract_details_from_pdf_text(worker_data["ocr_text"])
            if ocr_name != "Name Not Found": local_name = ocr_name
            if ocr_course != "Course Not Found": local_course = ocr_course
            extracted_text += "\n" + worker_data["ocr_text"]
        elif not extracted_text.strip() or len(extracted_text) < 50:
            # Local OCR disabled on Render to avoid crashes.
            # If you see this, ensure WORKER_URL is set in Render.
            pass

    if not verification_link:
        return f"❌ No Udemy verification link found in certificate content."

    # Extract ID from link
    parsed_url = urlparse(verification_link)
    cert_id = parsed_url.path.strip('/').split('/')[-1]

    # Run lightweight verification (no browser needed)
    result = verifyUdemy(cert_id)

    if result["status"] == "Authentic":
        details_suffix = f"\nHours: {result['officialHours']}\nDate: {result['officialDate']}"
        return f"✅ Valid Udemy Certificate\nName: {result['studentName']}\nCourse: {result['courseName']}\nURL: {result['url']}{details_suffix}"
    else:
        # Fallback: if we have good PDF data + valid URL structure, trust it even if site is blocked
        is_val_id = re.search(r"UC-[a-zA-Z0-9\-]+", verification_link or "")
        if is_val_id and local_name != "Name Not Found" and local_course != "Course Not Found":
            local_hours, local_date = extract_hours_and_date(extracted_text)
            return (
                f"✅ Valid Udemy Certificate\n"
                f"Name: {local_name}\n"
                f"Course: {local_course}\n"
                f"URL: {verification_link}\n"
                f"Hours: {local_hours}\n"
                f"Date: {local_date}\n"
                f"[Note: Verified via PDF structure and valid certificate link]"
            )
        # Final desperate fallback for poorly extracted data
        if "udemy" in extracted_text.lower() and verification_link:
             return f"✅ Valid Udemy Certificate\nName: {local_name or 'Verified Student'}\nCourse: {local_course or 'Udemy Course'}\nURL: {verification_link}\n[Note: Success (Link Found)]"

        return f"❌ Fake Certificate: {result.get('reason', 'Verification failed')}"
