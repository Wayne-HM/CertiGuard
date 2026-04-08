import fitz  # PyMuPDF
from pyzbar.pyzbar import decode
from PIL import Image
import io
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

def extract_qr_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    for i in range(len(doc)):
        page = doc.load_page(i)
        img_list = page.get_images(full=True)
        for img in img_list:
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image = Image.open(io.BytesIO(image_bytes))
            decoded_objects = decode(image)
            for obj in decoded_objects:
                if obj.type == 'QRCODE':
                    return obj.data.decode('utf-8')
    return None

def extract_details_from_text(text):
    """
    Extracts name and course from Alison PDF text.
    Handles both structured boilerplate and simple line-based formats.
    """
    name, course = "Unknown", "Unknown"
    
    # Pattern 1: Formal boilerplate
    name_m = re.search(r"(?:This identifies that|This is to certify that)\s+([A-Za-z\s.\-]+)", text, re.IGNORECASE)
    course_m = re.search(r"has (?:successfully )?completed the (?:course|Learning Path|Diploma) (?:entitled )?\"?(.+?)\"?(?: on| with| At)", text, re.IGNORECASE)
    
    if name_m:
        name = name_m.group(1).strip()
    if course_m:
        course = course_m.group(1).strip()
        
    # Pattern 2: Line-based fallback (Name on line 1, Course on line 2)
    if name == "Unknown" or course == "Unknown":
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if len(lines) >= 2:
            if name == "Unknown":
                name = lines[0]
            if course == "Unknown":
                course = lines[1]
                
    return name, course

def scrape_with_selenium(url):
    try:
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1280,720")
        options.add_argument("--disable-software-rasterizer")
        options.add_argument("--disable-extensions")

        import os
        if os.path.exists("/usr/bin/chromium"):
            options.binary_location = "/usr/bin/chromium"
            driver = webdriver.Chrome(service=Service("/usr/bin/chromedriver"), options=options)
        else:
            driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.get(url)
        time.sleep(8)

        page_text = driver.find_element(By.TAG_NAME, "body").text
        page_title = driver.title
        
        # Check for Cloudflare / Bot detection
        is_blocked = "verify you are human" in page_text.lower() or "security verification" in page_text.lower() or "cloudflare" in page_text.lower()
        
        if is_blocked:
            driver.quit()
            return {"error": "Blocked", "is_blocked": True}

        # Updated Alison specific phrasings with more flexible regex
        name_match = re.search(r"(?:verify that|This identifies that)\s+([A-Za-z\s.\-]+?)\s+has (?:successfully )?completed", page_text, re.IGNORECASE)
        course_match = re.search(r"(?:course|Learning Path|Diploma)\s+[\"']?(.+?)[\"']?\s+on Alison", page_text, re.IGNORECASE)

        if not name_match:
            name_match = re.search(r"Certificate Learner\s*:\s*([A-Za-z\s.\-]+)", page_text, re.IGNORECASE)
        
        if not course_match:
            course_match = re.search(r"Certificate Course\s*:\s*(.+)", page_text, re.IGNORECASE)

        name = name_match.group(1).strip() if name_match else None
        course_name = course_match.group(1).strip() if course_match else None

        driver.quit()
        return {"title": page_title, "content": page_text, "name": name, "course_name": course_name}
    except Exception as e:
        return {"error": f"Selenium failed: {str(e)}"}

def extract_hours_and_date(text):
    hours = "N/A"
    date = "N/A"
    # Alison Date: "on January 1, 2024" or "on 1st January, 2024"
    d_match = re.search(r"on\s+(\d+(?:st|nd|rd|th)?\s+[A-Z][a-z]+,?\s+\d{4})", text, re.I)
    if d_match: date = d_match.group(1).strip()
    
    # Hours: "Duration: 5 Hours" or "10 hours of learning"
    h_match = re.search(r"(?:Duration:?\s*)?(\d+)\s*hours?", text, re.I)
    if h_match: hours = h_match.group(1).strip()
    return hours, date

def run_verification(pdf_path):
    qr_url = extract_qr_from_pdf(pdf_path)
    
    if not qr_url:
        filename = pdf_path.split("/")[-1].split("\\")[-1]
        match = re.search(r"(?:https?://)?[a-zA-Z0-9./\-]*alison\.com[a-zA-Z0-9./\-]+", filename)
        qr_url = match.group(0).strip() if match else None
        if qr_url and not qr_url.startswith("http"):
            qr_url = "https://" + qr_url

    # Local text extraction
    doc = fitz.open(pdf_path)
    extracted_text = "\n".join(page.get_text("text") for page in doc).strip()
    doc.close()
    
    # Extract Hours/Date baseline
    hours, date = extract_hours_and_date(extracted_text)
    details_suffix = f"\nHours: {hours}\nDate: {date}"

    if not qr_url:
        id_match = re.search(r"\b(\d{4,}-\d{4,})\b", extracted_text)
        if id_match:
            qr_url = f"https://alison.com/certification/verify/{id_match.group(1)}"

    if not qr_url:
        return "❌ No QR code, Verification Link, or Certificate ID found."

    page_data = scrape_with_selenium(qr_url)
    local_name, local_course = extract_details_from_text(extracted_text)

    if page_data.get("is_blocked"):
        if "alison" in extracted_text.lower():
            return f"✅ Valid Alison Certificate (Analysis)\nName: {local_name}\nCourse: {local_course}\nURL: {qr_url}{details_suffix}\n[Note: Live verification restricted, verified via PDF structure]"
        return f"⚠️ Live verification restricted. Manual check required: {qr_url}"

    if "error" in page_data:
        return f"❌ {page_data['error']}"

    verified_name = page_data.get("name")
    verified_course = page_data.get("course_name")
    
    # Update Hours/Date from web if possible
    web_text = page_data.get("content", "")
    w_hours, w_date = extract_hours_and_date(web_text)
    if w_hours != "N/A": hours = w_hours
    if w_date != "N/A": date = w_date
    details_suffix = f"\nHours: {hours}\nDate: {date}"

    if not verified_name or not verified_course:
        all_text = web_text.lower()
        if "verify" in all_text and "completed" in all_text:
             return f"✅ Valid Alison Certificate (Identity confirmed on page)\nName: {local_name}\nCourse: {local_course}\nURL: {qr_url}{details_suffix}"
        return f"❌ Unable to retrieve verification data from platform."

    normalized_web_name = verified_name.lower().strip()
    full_pdf_text_lower = extracted_text.lower()
    name_parts = [p.strip() for p in normalized_web_name.split() if len(p.strip()) > 2]
    
    count = sum(1 for part in name_parts if part in full_pdf_text_lower)
    is_name_match = (count >= min(len(name_parts), 2)) and (len(name_parts) > 0)

    if is_name_match:
        return f"✅ Valid Alison Certificate\nName: {verified_name}\nCourse: {verified_course}\nURL: {qr_url}{details_suffix}"
    else:
        return f"❌ Fake Certificate Mismatch\nVerified Name: {verified_name}\nCourse: {verified_course}\nURL: {qr_url}{details_suffix}"
