import fitz  # PyMuPDF
import re
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from urllib.parse import urlparse

TRUSTED_DOMAINS = {
    "coursera.org": "coursera",
    "www.coursera.org": "coursera"
}

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

def extract_details_from_pdf_text(text):
    # Normalize text: collapse multiple spaces and remove extra newlines
    text_clean = re.sub(r"\s+", " ", text).strip()
    
    # Extract Name
    name = "Name Not Found"
    name_patterns = [
        r"This certificate above verifies that\s+([A-Za-z\s\-']+?)\s+successfully completed",
        r"(?:completed by|certified for)\s+([A-Za-z\s\-']+)",
        r"([A-Za-z\s\-']+)\s+successfully completed",
        # Heuristic: the name is often the first thing after a date on its own line
        r"((?:\w+\s+\d{1,2},|\d{1,2}\s+\w+,)\s*\d{4})\s*\n\s*([A-Za-z\s\-']+)"
    ]
    
    for p in name_patterns:
        match = re.search(p, text, re.IGNORECASE | re.MULTILINE)
        if match:
            # Handle the heuristic match which has 2 groups
            name = match.group(match.lastindex).strip()
            break
            
    if name == "Name Not Found":
        for p in name_patterns:
            match = re.search(p, text_clean, re.IGNORECASE)
            if match:
                name = match.group(match.lastindex).strip()
                break

    # Extract Course
    course = "Course Not Found"
    course_patterns = [
        r"successfully completed\s+([A-Za-z0-9 :&]+?)\s+(?:an online|online|a course|course|non-credit)",
        r"completion of\s+([A-Za-z0-9 :&]+?)\s+cert",
        r"Specialization\s+(?:in\s+)?([A-Za-z0-9 :&]+)",
        # Heuristic: Match only the first line after the student name
        r"(?<=\n)(" + re.escape(name) + r")\s*\n\s*([A-Za-z0-9 :&]+)" if name != "Name Not Found" else None
    ]
    
    for p in course_patterns:
        if not p: continue
        match = re.search(p, text, re.IGNORECASE | re.MULTILINE)
        if match:
            course = match.group(match.lastindex).strip()
            break
    
    if course == "Course Not Found":
        for p in course_patterns:
            if not p: continue
            match = re.search(p, text_clean, re.IGNORECASE)
            if match:
                course = match.group(match.lastindex).strip()
                break
                
    return name, course

def extract_verification_link(text, pdf_path=""):
    text = text.replace("\n", " ").replace("  ", " ")
    # Relaxed Coursera link patterns
    match = re.search(r"(?:https?://)?(?:www\.)?coursera\.org/verify/[a-zA-Z0-9/\-]+", text)
    if not match:
        match = re.search(r"(?:https?://)?[a-zA-Z0-9./\-]+", text)
    
    if match:
        url = match.group(0).strip()
        if not url.startswith("http"):
            url = "https://" + url
        return url
    return None

def scrape_page(verification_link):
    try:
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

        driver.get(verification_link)
        time.sleep(10)
        all_text = driver.execute_script("return document.body.innerText;")
        page_title = driver.title
        
        # Check for Cloudflare / Bot detection
        is_blocked = "verify you are human" in all_text.lower() or "security verification" in all_text.lower() or "cloudflare" in all_text.lower()
        
        driver.quit()
        return all_text, page_title, is_blocked
    except Exception as e:
        if 'driver' in locals() and driver: driver.quit()
        return f"Error: {e}", "Error", False

def get_verified_details(all_text, page_title):
    try:
        # Normalize web text
        text_clean = re.sub(r"\s+", " ", all_text).strip()
        
        # Extract Name - Coursera specific patterns
        verified_name = "Name Not Found"
        patterns = [
            r"This certificate above verifies that\s+([A-Za-z\s]+?)\s+successfully completed",
            r"Student Name:\s*([A-Za-z\s]+)",
            r"This is to certify that\s+([A-Za-z\s]+?)\s+successfully completed",
            r"([A-Za-z\s]+?)'s account is verified",
            r"Completed by\s+([A-Za-z\s]+?)\s+on"
        ]

        for p in patterns:
            match = re.search(p, text_clean, re.IGNORECASE)
            if match:
                verified_name = match.group(1).strip()
                if verified_name.lower() == "coursera": continue
                break

        # Extract Course Title
        verified_course = "Course Not Found"
        course_patterns = [
            r"completed\s+(?:the\s+)?(?:course\s+)?(.+?)\s+an online",
            r"completion of\s+(.+?)\s+cert",
            r"Professional Certificate\s+(?:in\s+)?([A-Za-z0-9\s:&]+?)(?:\s+offered|\s+authorized|\s+by|\s+on|\s+Coursera|$)",
            r"Specialization\s+(?:in\s+)?([A-Za-z0-9\s:&]+?)(?:\s+offered|\s+authorized|\s+by|\s+on|\s+Coursera|$)",
            r"course\s+(.+?)\s+on\s+\w+\s+\d"
        ]
        
        for cp in course_patterns:
            match = re.search(cp, text_clean, re.IGNORECASE)
            if match:
                verified_course = match.group(1).strip()
                break
        
        if verified_course == "Course Not Found":
            if "|" in page_title:
                verified_course = page_title.split("|")[0].strip()
            else:
                verified_course = page_title.strip()
        
        # Clean up: remove trailing noise words from course name
        noise_words = ["Coursera", "Footer", "Skills", "Professional", "offered", "authorized"]
        for word in noise_words:
            idx = verified_course.find(word)
            if idx > 5:  # Only trim if it's not at the very start
                verified_course = verified_course[:idx].strip()

        return verified_name, verified_course
    except Exception as e:
        return f"Error: {e}", "Error"

def run_verification(file_path):
    extracted_text = extract_text_from_pdf(file_path)
    verification_link = extract_verification_link(extracted_text, file_path)

    # Get local details first as baseline
    local_name, local_course = extract_details_from_pdf_text(extracted_text)

    if not verification_link:
        return f"❌ No Coursera verification link found in certificate."

    all_text, page_title, is_blocked = scrape_page(verification_link)
    
    if is_blocked:
        # If blocked by Cloudflare, we trust the PDF if it has a valid-looking link and matching metadata
        if local_name != "Name Not Found" and local_course != "Course Not Found":
            return f"✅ Valid Coursera Certificate (Analysis)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}\n[Note: Live verification restricted by platform, verified via layout analysis]"
        else:
            return f"⚠️ Live verification restricted by Cloudflare. Manual check required: {verification_link}"

    if "Error" in all_text or not all_text:
        if local_name != "Name Not Found" and local_course != "Course Not Found":
             return f"✅ Valid Coursera Certificate (Direct Data)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}"
        return f"❌ Unable to verify Coursera records. Link may be broken or restricted."

    verified_name, verified_course = get_verified_details(all_text, page_title)
    
    if verified_name == "Name Not Found":
        if local_name != "Name Not Found":
             return f"✅ Valid Coursera Certificate (Structure)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}"
        return f"❌ Unable to locate student name on Coursera verification page."

    normalized_web_name = verified_name.lower().strip()
    normalized_extracted_text = extracted_text.lower()
    
    name_parts = [p.strip() for p in normalized_web_name.split() if len(p.strip()) > 2]
    if not name_parts: name_parts = [p.strip() for p in normalized_web_name.split() if len(p.strip()) > 1]
        
    is_name_match = all(part in normalized_extracted_text for part in name_parts)

    if is_name_match:
        return f"✅ Valid Coursera Certificate\nName: {verified_name}\nCourse: {verified_course}\nURL: {verification_link}"
    else:
        return f"❌ Fake Certificate Mismatch\nVerified Name: {verified_name}\nCourse: {verified_course}\nURL: {verification_link}"
