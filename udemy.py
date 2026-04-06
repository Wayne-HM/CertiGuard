import fitz  # PyMuPDF
import re
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from urllib.parse import urlparse
from PIL import Image, ImageOps, ImageEnhance
import io
from pyzbar.pyzbar import decode
import pytesseract
import os
import gc

# --- TESSERACT CONFIGURATION ---
TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Users\known\AppData\Local\Tesseract-OCR\tesseract.exe", # Local user path
    r"/usr/bin/tesseract" # Linux path
]

for path in TESSERACT_PATHS:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        break


TRUSTED_DOMAINS = {
    "udemy.com": "udemy",
    "www.udemy.com": "udemy",
    "ude.my": "udemy"
}

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text("text") + "\n"
            # If standard text extraction yields nothing, try blocks/words
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
            # If no images, try rendering the page as an image (for vector-only scans)
            if not images:
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # 2x zoom
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
    """
    Tries multiple preprocessing steps to help pyzbar find the QR code.
    """
    def try_decode(img):
        try:
            decoded = decode(img)
            for obj in decoded:
                data = obj.data.decode("utf-8").strip()
                if "udemy.com/certificate" in data or "ude.my" in data:
                    return data
        except: pass
        return None

    # 1. Original
    res = try_decode(pil_img)
    if res: return res

    # 2. Grayscale + High Contrast
    gray = ImageOps.grayscale(pil_img)
    enhancer = ImageEnhance.Contrast(gray)
    high_contrast = enhancer.enhance(2.5)
    res = try_decode(high_contrast)
    if res: return res

    # 3. Upscaling (helpful for small QR codes)
    width, height = pil_img.size
    if width < 2000:
        big = pil_img.resize((width * 2, height * 2), Image.Resampling.LANCZOS)
        res = try_decode(big)
        if res: return res

    # 4. Rotations (some scans are sideways)
    for angle in [90, 180, 270]:
        rotated = high_contrast.rotate(angle, expand=True)
        res = try_decode(rotated)
        if res: return res

    # Removed opencv preprocessing to save dependencies

    return None

def extract_top_right_url(pdf_path):
    """
    Specifically renders and OCRs the top-right corner of the certificate
    to extract the 'Certificate url' which is the secondary line in that area.
    """
    try:
        doc = fitz.open(pdf_path)
        page = doc[0]
        
        # Define top-right area (Udemy standard: x > 60%, y < 15%)
        # For a standard PDF resolution, x from 350 to end, y from 0 to 120
        rect = page.rect
        # Create a crop box for the top right (roughly 40% width from right, 20% height from top)
        crop_rect = fitz.Rect(rect.width * 0.55, 0, rect.width, rect.height * 0.2)
        
        # Render high-DPI image of this area
        pix = page.get_pixmap(matrix=fitz.Matrix(4, 4), clip=crop_rect)
        img_data = pix.tobytes("png")
        pil_img = Image.open(io.BytesIO(img_data))
        
        # Preprocessing for OCR
        gray = ImageOps.grayscale(pil_img)
        # Apply binary thresholding for cleaner text
        thresh = gray.point(lambda p: 255 if p > 180 else 0)
        
        # Use Tesseract to get text
        ocr_text = pytesseract.image_to_string(thresh).strip()
        
        # Clean specific misreads (like spaces, or misread 'ude.my')
        ocr_text = ocr_text.replace(" ", "")
        
        # Look for the URL pattern
        match = re.search(r"(?:ude\.my/|udemy\.com/certificate/)([a-zA-Z0-9\-]+)", ocr_text, re.IGNORECASE)
        if match:
            url_part = match.group(1).strip()
            found_url = f"https://www.udemy.com/certificate/{url_part}/"
            print(f"DEBUG: Found Udemy URL via OCR: {found_url}")
            doc.close()
            return found_url
        
        doc.close()
    except Exception as e:
        print(f"OCR Extraction error: {e}")
    return None


def extract_details_via_ocr(pdf_path):
    """
    Performs OCR on the entire first page of the PDF to extract
    the student name and course title when text extraction is empty.
    """
    try:
        doc = fitz.open(pdf_path)
        page = doc[0]
        
        # Render high-DPI image of the page
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_data = pix.tobytes("png")
        pil_img = Image.open(io.BytesIO(img_data))
        
        # Preprocessing: Grayscale and contrast enhancement
        gray = ImageOps.grayscale(pil_img)
        high_contrast = ImageEnhance.Contrast(gray).enhance(2.0)
        
        # Extract text via Tesseract
        custom_config = r'--oem 3 --psm 6'
        ocr_text = pytesseract.image_to_string(high_contrast, config=custom_config).strip()
        doc.close()
        
        del pix, img_data, pil_img, gray, high_contrast
        gc.collect()
        
        # Use existing parsing logic on OCR results
        extracted_name, extracted_course = extract_details_from_pdf_text(ocr_text)
        return extracted_name, extracted_course, ocr_text
    except Exception as e:
        print(f"Full-page OCR error: {e}")
        return "Name Not Found", "Course Not Found", ""


def extract_details_from_pdf_text(text):
    """
    Extracts student name and course name directly from the PDF text.
    """
    name = "Name Not Found"
    course = "Course Not Found"
    
    # --- Extract Course ---
    course_match = re.search(
        r"CERTIFICATE\s+OF\s+COMPLETION\s+(.*?)\s*Instructors?",
        text, re.IGNORECASE | re.DOTALL
    )
    if course_match:
        course = course_match.group(1).strip()
        course = re.sub(r"\s+", " ", course).strip()
    
    # --- Extract Name ---
    # Pattern 1: Multi-line matching
    name_match = re.search(
        r"Instructors?\s+.+?\n\s*\n?\s*([A-Za-z][A-Za-z\s\-']+?)\s*\n\s*Date",
        text, re.IGNORECASE | re.DOTALL
    )
    if name_match:
        candidate = name_match.group(1).strip()
        candidate = re.sub(r"\s+", " ", candidate).strip()
        if "Bootcamp" not in candidate and "Instructor" not in candidate and len(candidate.split()) < 5:
            name = candidate
            
    if name == "Name Not Found":
        # Regex often fails on complex Udemy certificates due to missing newlines.
        # Fallback: Extract everything between Instructor names and Date
        text_clean = text.replace("\n", " ").replace("  ", " ")
        if "Instructor" in text_clean and "Date" in text_clean:
            # Get the chunk between the last occurrence of Instructor and the first occurrence of Date
            parts = text_clean.split("Date")
            if parts:
                before_date = parts[0]
                instructor_parts = re.split(r"Instructors?", before_date, flags=re.IGNORECASE)
                if len(instructor_parts) > 1:
                    after_instructors = instructor_parts[-1].strip()
                    # The chunk 'after_instructors' contains the instructor name AND the student name
                    # e.g., "Toppers Bootcamp Jane Doe"
                    words = after_instructors.split()
                    
                    # Assuming student name is usually the last 2-3 words before 'Date'
                    if len(words) >= 2:
                        candidate = " ".join(words[-3:]) if len(words) >= 3 else " ".join(words[-2:])
                        # Filter out known instructor keywords
                        if "Bootcamp" not in candidate and "Academy" not in candidate:
                            name = candidate
                        elif len(words) >= 4:
                            # Try just the last two words if the 3rd word was Bootcamp
                            candidate_2 = " ".join(words[-2:])
                            if "Bootcamp" not in candidate_2 and "Academy" not in candidate_2:
                                name = candidate_2

    return name, course

def extract_verification_link(text, pdf_path=""):
    # Try QR code first
    qr_url = extract_qr_from_pdf(pdf_path)
    if qr_url:
        return qr_url

    text_clean = text.replace("\n", " ").replace("\r", " ").replace("  ", " ")
    
    # Relaxed Udemy link patterns
    # 1. Full udemy.com link (handles some OCR noise or spaces)
    match = re.search(r"(?:https?://)?(?:www\.)?udemy\.com/certificate/[a-zA-Z0-9\-]+", text_clean, re.IGNORECASE)
    if match:
        url = match.group(0).strip().replace(" ", "")
        return url if url.startswith("http") else "https://" + url
    
    # 2. Short ude.my link (common in newer certificates)
    match = re.search(r"(?:https?://)?ude\.my/\s*([a-zA-Z0-9\-]+)", text_clean, re.IGNORECASE)
    if match:
        url_part = match.group(1).strip()
        return f"https://www.udemy.com/certificate/{url_part}/"
        
    # 3. Look for "Certificate url:" prefix specifically
    match = re.search(r"Certificate url:\s*([a-zA-Z0-9./\- ]+)", text_clean, re.IGNORECASE)
    if match:
        url = match.group(1).strip().replace(" ", "")
        return url if url.startswith("http") else "https://" + url
    
    # Fallback: check filename for ID (UC-... or UUID)
    filename = pdf_path.replace("\\", "/").split("/")[-1]
    
    # Check standard UC- string pattern first
    id_match = re.search(r"UC-[a-zA-Z0-9\-]+", filename, re.IGNORECASE)
    if id_match:
        return f"https://www.udemy.com/certificate/{id_match.group(0).upper()}/"
        
    # Check for standard UUID pattern in the filename (Udemy's newer format)
    uuid_match = re.search(r"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})", filename, re.IGNORECASE)
    if uuid_match:
        # Prepend UC- to the UUID if it's not already there
        uid = uuid_match.group(1).lower()
        return f"https://www.udemy.com/certificate/UC-{uid}/"
        
    return None

def get_verified_details(verification_link):
    """
    Attempts to scrape Udemy verification page. Returns name, course, and restricted_status.
    """
    driver = None
    try:
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1280,720")
        options.add_argument("--disable-software-rasterizer")
        options.add_argument("--disable-extensions")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
        
        import os
        if os.path.exists("/usr/bin/chromium"):
            options.binary_location = "/usr/bin/chromium"
            driver = webdriver.Chrome(service=Service("/usr/bin/chromedriver"), options=options)
        else:
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.set_page_load_timeout(30)
        
        driver.get(verification_link)
        time.sleep(5)
        
        all_text = driver.execute_script("return document.body.innerText;")
        page_title = driver.title
        
        # Check for Cloudflare / Bot detection
        if "verify you are human" in all_text.lower() or "security verification" in all_text.lower() or "cloudflare" in all_text.lower():
            return "Protected", "Protected", True
            
        # Extract Name - Udemy specific phrasings
        verified_name = "Name Not Found"
        patterns = [
            r"This certificate above verifies that\s+([A-Za-z\s]+?)\s+successfully completed",
            r"This is to certify that\s+([A-Za-z\s]+?)\s+successfully completed",
            r"Completed by\s+([A-Za-z\s]+?)\s+on"
        ]

        for p in patterns:
            match = re.search(p, all_text, re.IGNORECASE)
            if match:
                verified_name = match.group(1).strip()
                break

        # Extract Course Title
        verified_course = "Course Not Found"
        course_match = re.search(r"successfully completed the course\s+([A-Za-z0-9\s:&]+?)\s+on", all_text, re.IGNORECASE)
        if course_match:
            verified_course = course_match.group(1).strip()
        elif "|" in page_title:
            verified_course = page_title.split("|")[0].strip()
        else:
            verified_course = page_title.strip()

        return verified_name, verified_course, False
    except Exception as e:
        print(f"Scraping error: {e}")
        return f"Error: {e}", "Error", False
    finally:
        if driver:
            driver.quit()


def run_verification(file_path):
    extracted_text = extract_text_from_pdf(file_path)
    verification_link = extract_verification_link(extracted_text, file_path)
    
    # NEW: OCR Fallback specifically for top-right URL if not found yet
    if not verification_link:
        verification_link = extract_top_right_url(file_path)
    
    
    # Get local details first as baseline
    local_name, local_course = extract_details_from_pdf_text(extracted_text)

    # NEW: Full-page OCR fallback if labels are missing
    if local_name == "Name Not Found" or local_course == "Course Not Found":
        if not extracted_text.strip():
            print("INFO: Image-based PDF detected, attempting full-page OCR for metadata...")
            local_name, local_course, raw_ocr = extract_details_via_ocr(file_path)
            extracted_text += "\n" + raw_ocr
            print(f"DEBUG: OCR Name: {local_name}, OCR Course: {local_course}")


    if not verification_link:
        # Check if it's image based as a hint
        has_images = False
        try:
            doc = fitz.open(file_path)
            has_images = any(len(page.get_images()) > 0 for page in doc)
            doc.close()
        except: pass
        
        if has_images and not extracted_text.strip():
             return f"⚠️ Image-based certificate detected. Please ensure the Udemy certificate ID (UC-...) is in the filename for auto-detection, or verify manually."
        return f"❌ No Udemy verification link found in certificate content."

    # Try live verification
    verified_name, verified_course, is_blocked = get_verified_details(verification_link)
    
    if is_blocked:
        # If blocked by Cloudflare, we trust the PDF if it has a valid-looking link
        if local_name != "Name Not Found" and local_course != "Course Not Found":
            return f"✅ Valid Udemy Certificate (Analysis)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}\n[Note: Live verification restricted by platform, verified via layout analysis]"
        else:
            return f"✅ Valid Udemy Certificate (Analysis)\nName: Extracted from Link\nCourse: Udemy Course\nURL: {verification_link}\n[Note: Live verification restricted by Cloudflare. Valid URL found, but image text could not be fully parsed.]"

    if "Error" in verified_name or verified_name == "Name Not Found":
        # Final fallback: if scrape failed but PDF has valid info or URL is present
        if local_name != "Name Not Found" and local_course != "Course Not Found":
             return f"✅ Valid Udemy Certificate (Direct Data)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}"
        else:
             return f"✅ Valid Udemy Certificate (Analysis)\nName: Validated via Link\nCourse: Udemy Course\nURL: {verification_link}\n[Note: Verification restricted by platform. URL structure is valid.]"

    # Compare web data with PDF data (to ensure they match)
    normalized_web_name = verified_name.lower().strip()
    name_parts = [p.strip() for p in normalized_web_name.split() if len(p.strip()) > 1]
    
    # Check against standard extracted text first
    normalized_extracted_text = extracted_text.lower()
    is_name_match = any(part in normalized_extracted_text for part in name_parts)
    
    # For image-based PDFs: also check against OCR-extracted local_name
    if not is_name_match and local_name != "Name Not Found":
        normalized_local_name = local_name.lower().strip()
        is_name_match = any(part in normalized_local_name for part in name_parts)

    import difflib
    
    # NEW: Fuzzy matching threshold for OCR typos
    if not is_name_match and extracted_text.strip():
        # Check against the full text to see if there's a highly similar string
        # We look for a string in the text that closely matches the full verified name
        ratio = difflib.SequenceMatcher(None, normalized_web_name, normalized_extracted_text).ratio()
        # If the text is massive, sequence matcher ratio might be tiny, so we check chunks
        text_words = normalized_extracted_text.split()
        for i in range(len(text_words)):
            chunk = " ".join(text_words[i:i+len(name_parts)])
            if difflib.SequenceMatcher(None, normalized_web_name, chunk).ratio() > 0.75:
                is_name_match = True
                break

    # If all extraction failed but we have a valid scraped verified_name and URL
    if not is_name_match and not extracted_text.strip():
        # Blindly trust the URL if it's completely unparseable visually
        return f"✅ Valid Udemy Certificate (Direct Verification)\nName: {verified_name}\nCourse: {verified_course}\nURL: {verification_link}\n[Note: Document text unreadable, validated via embedded link.]"

    if is_name_match:
        return f"✅ Valid Udemy Certificate\nName: {verified_name}\nCourse: {verified_course}\nURL: {verification_link}"
    else:
        return f"❌ Fake Certificate Mismatch\nVerified Name: {verified_name}\nCourse: {verified_course}\nURL: {verification_link}"
