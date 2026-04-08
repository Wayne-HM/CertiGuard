import fitz  # PyMuPDF
import re
import time
import os
import io
import gc
import pytesseract
from PIL import Image, ImageOps, ImageEnhance
from pyzbar.pyzbar import decode
from playwright.sync_api import sync_playwright
from urllib.parse import urlparse

# --- TESSERACT CONFIGURATION ---
TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Users\known\AppData\Local\Tesseract-OCR\tesseract.exe",
    r"/usr/bin/tesseract"
]

for path in TESSERACT_PATHS:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        break

# --- HELPERS FOR PDF EXTRACTION ---

def perform_high_precision_ocr(pix):
    try:
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        w, h = img.size
        img = img.resize((w * 2, h * 2), Image.Resampling.LANCZOS)
        img = ImageOps.grayscale(img)
        img = ImageEnhance.Sharpness(img).enhance(2.0)
        img = img.point(lambda p: 255 if p > 140 else 0)
        text = pytesseract.image_to_string(img, config='--oem 3 --psm 6').strip()
        return text
    except Exception as e:
        print(f"High-precision OCR error: {e}")
        return ""

def extract_text_from_pdf(pdf_path):
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
    def try_decode(img):
        try:
            decoded = decode(img)
            for obj in decoded:
                data = obj.data.decode("utf-8").strip()
                if "udemy.com/certificate" in data or "ude.my" in data:
                    return data
        except: pass
        return None

    res = try_decode(pil_img)
    if res: return res

    gray = ImageOps.grayscale(pil_img)
    enhancer = ImageEnhance.Contrast(gray)
    high_contrast = enhancer.enhance(2.5)
    res = try_decode(high_contrast)
    if res: return res

    width, height = pil_img.size
    if width < 2000:
        big = pil_img.resize((width * 2, height * 2), Image.Resampling.LANCZOS)
        res = try_decode(big)
        if res: return res

    for angle in [90, 180, 270]:
        rotated = high_contrast.rotate(angle, expand=True)
        res = try_decode(rotated)
        if res: return res

    return None

def extract_top_right_url(pdf_path):
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
    if len(lines) >= 3:
        name = clean_text_noise(lines[-3])
    course = "Course Not Found"
    course_match = re.search(
        r"CERTIFICATE\s+OF\s+COMPLETION\s+(.*?)\s*(?:Instructors?|URL:|Date:|on\s+[A-Z][a-z]+|$)",
        text, re.IGNORECASE | re.DOTALL
    )
    if course_match:
        course = clean_text_noise(course_match.group(1).strip())
    name_blacklist = ["Web Coding", "Coding", "Bootcamp", "Academy", "Development", "Learning", "Udemy", "Certificate", "Instructor", "Course", "Date"]
    if not name or any(word.lower() == name.lower() for word in name_blacklist):
        for line in lines[-5:]:
            candidate = clean_text_noise(line)
            if len(candidate.split()) >= 2 and not any(w.lower() in candidate.lower() for w in name_blacklist):
                name = candidate
                break
    return name, course

def extract_verification_link(text, pdf_path=""):
    qr_url = extract_qr_from_pdf(pdf_path)
    if qr_url:
        return qr_url
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
    filename = pdf_path.replace("\\", "/").split("/")[-1]
    id_match = re.search(r"UC-[a-zA-Z0-9\-]+", filename, re.IGNORECASE)
    if id_match:
        uid = id_match.group(0).lower()
        if uid.startswith("uc-"):
            uid = "UC-" + uid[3:]
        return f"https://www.udemy.com/certificate/{uid}/"
    uuid_match = re.search(r"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})", filename, re.IGNORECASE)
    if uuid_match:
        uid = uuid_match.group(1).lower()
        return f"https://www.udemy.com/certificate/UC-{uid}/"
    return None

def extract_details_via_ocr(pdf_path):
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

# --- LIVE VERIFICATION ENGINE (USER PROVIDED) ---

def verifyUdemy(certId):
    """Core verification logic using Playwright and Tesseract"""
    certId = certId.replace('ude.my/', '').strip()
    if not certId.startswith('UC-'):
        if '/' in certId:
            certId = cert_id_clean = certId.split('/')[-1]
            if not cert_id_clean.startswith('UC-'):
                 certId = 'UC-' + cert_id_clean
            else:
                 certId = cert_id_clean
        else:
            certId = 'UC-' + certId
        
    url = f"https://www.udemy.com/certificate/{certId}/"
    
    studentName = ""
    courseName = ""
    issueDate = ""
    hours = ""
    htmlCourseName = ""
    
    max_retries = 3
    
    for attempt in range(max_retries):
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=20000)
                
                for _ in range(7):
                    page.wait_for_timeout(1000)
                    pageText = page.inner_text("body")
                    
                    verify_match = re.search(r'verifies that\s+(.+?)\s+successfully completed the course\s+(.+?)\s+on\s+(.+?)\s+as taught by', pageText, re.IGNORECASE | re.DOTALL)
                    
                    if verify_match:
                        studentName = verify_match.group(1).replace('\n', ' ').strip()
                        htmlCourseName = verify_match.group(2).replace('\n', ' ').strip()
                        issueDate = verify_match.group(3).replace('\n', ' ').strip()
                        
                    hours_match = re.search(r'(\d+(?:\.\d+)?)\s*total hours', pageText, re.IGNORECASE)
                    if hours_match:
                        hours = hours_match.group(1).strip()

                    if studentName and htmlCourseName:
                        break 

                if studentName and htmlCourseName:
                    page.wait_for_timeout(3000) 
                    
                    screenshot_path = f"temp_udemy_screen_{certId}.png"
                    
                    cert_element = page.locator('div[data-purpose="certificate"]')
                    if cert_element.count() > 0:
                        cert_element.first.screenshot(path=screenshot_path)
                    else:
                        page.screenshot(path=screenshot_path, full_page=True)
                    
                    try:
                        screen_text = pytesseract.image_to_string(screenshot_path)
                        course_match_img = re.search(r'CERTIFICATE\s+OF\s+COMPLETION\s*\n+(.+?)\n+(?:Instructors?|Instructor)', screen_text, re.IGNORECASE | re.DOTALL)
                        
                        if course_match_img:
                            ocr_course = course_match_img.group(1).replace('\n', ' ').strip()
                            if len(ocr_course) > 5:
                                courseName = ocr_course
                    except Exception:
                        pass
                    finally:
                        if os.path.exists(screenshot_path):
                            os.remove(screenshot_path)
                            
                    if not courseName:
                        courseName = htmlCourseName
                        
            except Exception as e:
                print(f"Playwright error: {e}")
                
            browser.close()
            
        if studentName and courseName:
            break
        elif attempt < max_retries - 1:
            time.sleep(2) 
            
    if studentName and courseName:
        return {
            "status": "Authentic",
            "studentName": studentName,
            "courseName": courseName,
            "officialDate": issueDate,
            "officialHours": hours,
            "url": url
        }
        
    return {"status": "Fake", "reason": "Could not parse official Udemy verification page. Certificate ID may be invalid."}

# --- MAIN RUNNER ---

def run_verification(file_path):
    """Bridge between PDF extraction and Playwright verification"""
    extracted_text = extract_text_from_pdf(file_path)
    verification_link = extract_verification_link(extracted_text, file_path)
    
    if not verification_link:
        verification_link = extract_top_right_url(file_path)
    
    # Get local details first
    local_name, local_course = extract_details_from_pdf_text(extracted_text)

    if local_name == "Name Not Found" or local_course == "Course Not Found":
        if not extracted_text.strip() or len(extracted_text) < 50:
            ocr_name, ocr_course, raw_ocr = extract_details_via_ocr(file_path)
            if ocr_name != "Name Not Found": local_name = ocr_name
            if ocr_course != "Course Not Found": local_course = ocr_course
            extracted_text += "\n" + raw_ocr

    if not verification_link:
        return f"❌ No Udemy verification link found in certificate content."

    # Extract ID from link
    parsed_url = urlparse(verification_link)
    cert_id = parsed_url.path.strip('/').split('/')[-1]
    
    # Run Playwright Verification
    result = verifyUdemy(cert_id)
    
    if result["status"] == "Authentic":
        details_suffix = f"\nHours: {result['officialHours']}\nDate: {result['officialDate']}"
        return f"✅ Valid Udemy Certificate\nName: {result['studentName']}\nCourse: {result['courseName']}\nURL: {result['url']}{details_suffix}"
    else:
        return f"❌ Fake Certificate: {result.get('reason', 'Verification failed')}"
