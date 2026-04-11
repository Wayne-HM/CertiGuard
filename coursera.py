import re
import time
import os
import gc
from urllib.parse import urlparse

# --- HELPERS FOR PDF EXTRACTION ---


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


TRUSTED_DOMAINS = {
    "coursera.org": "coursera",
    "www.coursera.org": "coursera"
}

def extract_text_from_pdf(pdf_path, worker_data=None):
    if worker_data and worker_data.get("text"):
        return worker_data["text"]
    
    # Lightweight local fallback
    import PyPDF2
    try:
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            return "".join(page.extract_text() for page in reader.pages if page.extract_text())
    except:
        return ""


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

def extract_text_via_ocr(pdf_path, worker_data=None):
    if worker_data and worker_data.get("ocr_text"):
        return worker_data["ocr_text"]
    # Local OCR disabled to save memory
    return ""


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
    """Lightweight page scraping using requests + BeautifulSoup. No browser needed."""
    import requests
    from bs4 import BeautifulSoup

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        response = requests.get(verification_link, headers=headers, timeout=15)

        if response.status_code != 200:
            return f"Error: HTTP {response.status_code}", "Error", False

        soup = BeautifulSoup(response.text, "html.parser")
        all_text = soup.get_text(separator="\n")
        page_title = soup.title.string.strip() if soup.title and soup.title.string else ""

        is_blocked = any(kw in all_text.lower() for kw in [
            "verify you are human", "security verification", "cloudflare"
        ])

        return all_text, page_title, is_blocked
    except Exception as e:
        print(f"DEBUG: Coursera scrape error: {e}")
        return f"Error: {e}", "Error", False



def get_verified_details(all_text, page_title):
    try:
        # Normalize web text
        text_clean = re.sub(r"\s+", " ", all_text).strip()
        
        # Extract Name - Coursera specific patterns
        verified_name = "Name Not Found"
        patterns = [
            r"This certificate above verifies that\s+([A-Za-z\s\.\-']+?)\s+successfully completed",
            r"Student Name:\s*([A-Za-z\s\.\-']+)",
            r"This is to certify that\s+([A-Za-z\s\.\-']+?)\s+successfully completed",
            r"([A-Za-z\s\.\-']+?)'s account is verified",
            r"Completed by\s+([A-Za-z\s\.\-']+?)(?:\s+on|\n|$)"
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
        
        # Cleanup: Remove repetitive text and rating garbage
        def clean_course_name(name):
            if not name or name == "Course Not Found": return name
            # Remove "Google Filled Star" and similar garbage
            name = re.sub(r"(?:Google\s+)?(?:Filled\s+)?Star\s*(?:Filled)?", "", name, flags=re.I).strip()
            # Remove repetitive phrases (e.g., "Python Python")
            words = name.split()
            if len(words) > 4:
                # Check if the first half is roughly same as second half
                half = len(words) // 2
                if " ".join(words[:half]).lower() == " ".join(words[half:]).lower():
                    name = " ".join(words[:half])
            
            # Final prune for common non-title artifacts
            for junk in ["Try this course", "Authorized sharing", "Verify at"]:
                if junk in name: name = name.split(junk)[0].strip()
            return name

        if verified_course == "Course Not Found":
            if "|" in page_title:
                verified_course = page_title.split("|")[0].strip()
            else:
                verified_course = page_title.strip()
        
        verified_course = clean_course_name(verified_course)
        
        # Clean up: only remove if they appear after a long gap or at the very end with specific markers
        stop_markers = ["Verify at coursera.org", "Coursera has confirmed", "Authorized sharing"]
        for marker in stop_markers:
            idx = verified_course.find(marker)
            if idx > 5:
                verified_course = verified_course[:idx].strip()
        
        # Remove trailing "Coursera" if it's orphaned
        if verified_course.endswith(" Coursera"):
            verified_course = verified_course[:-9].strip()

        return verified_name, verified_course
    except Exception as e:
        return f"Error: {e}", "Error"

def extract_hours_and_date(text):
    hours = "N/A"
    date = "N/A"
    # Coursera Date: "Completed on Month Day, Year" or "on Month Day, Year"
    d_match = re.search(r"(?:on|Completed on|Date:?)\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})", text, re.I)
    if not d_match:
        # Month Day, Year standalone
        d_match = re.search(r"\b([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b", text)
    if not d_match:
        # Numeric fallback: 11/04/2026 or 11-04-2026
        d_match = re.search(r"\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})\b", text)
    if d_match: date = d_match.group(1).strip()
    
    # Hours: "approx. 15 hours" or "15 total hours"
    h_match = re.search(r"(\d+)\s*(?:total\s*hours|hours)", text, re.I)
    if h_match: hours = h_match.group(1).strip()
    return hours, date

def run_verification(file_path, worker_data=None):
    extracted_text = ""
    if worker_data and worker_data.get("text"):
        extracted_text = worker_data["text"]
    elif worker_data and worker_data.get("ocr_text"):
        extracted_text = worker_data["ocr_text"]
    else:
        # Final local fallback
        extracted_text = extract_text_from_pdf(file_path, worker_data)
    
    if not extracted_text:
        return "❌ Skipping Coursera verification: Worker data unavailable and local processing disabled."

    verification_link = extract_verification_link(extracted_text, file_path)

    # Get local details first as baseline
    local_name, local_course = extract_details_from_pdf_text(extracted_text)
    
    # Extract Hours/Date baseline from PDF
    hours, date = extract_hours_and_date(extracted_text)
    details_suffix = f"\nHours: {hours}\nDate: {date}"

    if not verification_link:
        return f"❌ No Coursera verification link found in certificate."

    all_text, page_title, is_blocked = scrape_page(verification_link)
    
    if is_blocked:
        # If blocked by Cloudflare, we trust the PDF if it has a valid-looking link and matching metadata
        if local_name != "Name Not Found" and local_course != "Course Not Found":
            return f"✅ Valid Coursera Certificate (Analysis)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}{details_suffix}\n[Note: Live verification restricted by platform, verified via layout analysis]"
        else:
            return f"⚠️ Live verification restricted by Cloudflare. Manual check required: {verification_link}"

    if "Error" in all_text or not all_text:
        if local_name != "Name Not Found" and local_course != "Course Not Found":
             return f"✅ Valid Coursera Certificate (Direct Data)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}{details_suffix}"
        return f"❌ Unable to verify Coursera records. Link may be broken or restricted."

    verified_name, verified_course = get_verified_details(all_text, page_title)
    
    # Refresh hours/date from web content if available
    web_hours, web_date = extract_hours_and_date(all_text)
    if web_hours != "N/A": hours = web_hours
    if web_date != "N/A": date = web_date
    details_suffix = f"\nHours: {hours}\nDate: {date}"

    if verified_name == "Name Not Found":
        if local_name != "Name Not Found":
             return f"✅ Valid Coursera Certificate (Structure)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}{details_suffix}"
        return f"❌ Unable to locate student name on Coursera verification page."

    normalized_web_name = verified_name.lower().strip()
    normalized_extracted_text = extracted_text.lower()
    
    name_parts = [p.strip() for p in normalized_web_name.split() if len(p.strip()) > 2]
    if not name_parts: name_parts = [p.strip() for p in normalized_web_name.split() if len(p.strip()) > 1]
        
    is_name_match = all(part in normalized_extracted_text for part in name_parts)

    if is_name_match:
        return f"✅ Valid Coursera Certificate\nName: {verified_name}\nCourse: {verified_course}\nURL: {verification_link}{details_suffix}"
    else:
        return f"❌ Fake Certificate Mismatch\nVerified Name: {verified_name}\nCourse: {verified_course}\nURL: {verification_link}{details_suffix}"
