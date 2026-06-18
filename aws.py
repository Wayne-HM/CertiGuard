"""
CertiGuard — AWS Academy Certificate Verifier
==============================================
Verifies AWS Academy certificates via Credly badge pages.
Uses lightweight requests + BeautifulSoup (NO Playwright/Chromium).
"""

import re
import time
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
]


def scrape_credly_badge(url):
    """Scrape a Credly badge page for student name, course, and date."""
    import requests
    from bs4 import BeautifulSoup

    student_name = ""
    course_name = ""
    issue_date = ""

    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        print(f"[DEBUG AWS] Scraping Credly badge: {url}")
        response = requests.get(url, headers=headers, timeout=20, allow_redirects=True)

        if response.status_code in [403, 429]:
            print(f"[DEBUG AWS] Blocked by Credly (HTTP {response.status_code})")
            return {"status": "BotBlock"}

        if response.status_code != 200:
            return {"status": "Fake", "reason": f"Credly returned HTTP {response.status_code}"}

        soup = BeautifulSoup(response.text, "html.parser")
        page_text = soup.get_text(separator="\n")
        html = response.text

        # Check for invalid badge
        if "not found" in page_text.lower() or "invalid" in page_text.lower():
            return {"status": "Fake", "reason": "Badge not found or invalid on Credly database."}

        # 1. Extract Name — HTML regex (most reliable for Credly)
        name_match = re.search(r'This badge was issued to\s*<a[^>]*>([^<]+)</a>', html, re.IGNORECASE)
        if not name_match:
            name_match = re.search(r'This badge was issued to\s*([A-Za-z\s]+)', page_text, re.IGNORECASE)
        if name_match:
            student_name = name_match.group(1).strip()

        # 2. Extract Course/Badge Name — <h1> or meta
        course_match = re.search(r'<h1[^>]*>([^<]+)</h1>', html, re.IGNORECASE)
        if not course_match:
            og_title = soup.find("meta", property="og:title")
            if og_title and og_title.get("content"):
                course_name = og_title["content"].strip()
        if course_match and not course_name:
            course_name = course_match.group(1).strip()

        # Fallback: search for "AWS Academy Graduate" pattern
        if not course_name:
            aws_match = re.search(r'(AWS Academy Graduate[^\n]+)', page_text, re.IGNORECASE)
            if aws_match:
                course_name = aws_match.group(1).strip()

        # 3. Extract Date
        date_match = re.search(r'Date issued:\s*([^<\n]+)', html, re.IGNORECASE)
        if not date_match:
            date_match = re.search(r'Date issued:\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})', page_text, re.IGNORECASE)
        if date_match:
            issue_date = date_match.group(1).strip()

        # 4. Fallback: og:description
        if not student_name:
            og_desc = soup.find("meta", property="og:description")
            if og_desc and og_desc.get("content"):
                desc = og_desc["content"]
                m = re.search(r'earned by\s+(.+?)(?:\.|,|$)', desc, re.IGNORECASE)
                if m:
                    student_name = m.group(1).strip()

        print(f"[DEBUG AWS] Extracted Name: '{student_name}'")
        print(f"[DEBUG AWS] Extracted Course: '{course_name}'")
        print(f"[DEBUG AWS] Extracted Date: '{issue_date}'")

    except Exception as e:
        print(f"[DEBUG AWS] Scrape error: {e}")
        return {"status": "Fake", "reason": f"Network error: {str(e)}"}

    if student_name and course_name:
        result = {
            "status": "Authentic",
            "studentName": student_name,
            "courseName": course_name,
        }
        if issue_date:
            result["officialDate"] = issue_date
        return result

    return {"status": "Fake", "reason": "Could not parse details from Credly badge page."}


def verify_aws(credly_url):
    """Verify an AWS certificate via its Credly badge URL with retry logic."""
    max_retries = 3

    for attempt in range(max_retries):
        result = scrape_credly_badge(credly_url)

        if result.get("status") == "BotBlock":
            if attempt < max_retries - 1:
                wait = random.uniform(2.0, 4.0)
                print(f"[DEBUG AWS] Retrying in {wait:.1f}s... (Attempt {attempt + 2})")
                time.sleep(wait)
                continue
            return {"status": "Fake", "reason": "Blocked by Credly after multiple attempts."}

        return result

    return {"status": "Fake", "reason": "Failed after multiple attempts."}


def extract_credly_url(text, pdf_path=""):
    """Extract a Credly URL from certificate text or filename."""
    # Pattern 1: credly.com/go/XXXXX (short URL)
    match = re.search(r'(credly\.com/go/[A-Za-z0-9]+)', text)
    if match:
        return "https://www." + match.group(1)

    # Pattern 2: credly.com/badges/UUID
    match = re.search(r'(credly\.com/badges/[A-Za-z0-9\-]+)', text)
    if match:
        return "https://www." + match.group(1)

    # Pattern 3: Full URL with https
    match = re.search(r'(https?://[^\s]*credly\.com/[^\s]+)', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # Filename fallback
    if pdf_path:
        filename = pdf_path.replace("\\", "/").split("/")[-1]
        match = re.search(r'credly[_\-]?([A-Za-z0-9]+)', filename, re.IGNORECASE)
        if match:
            return f"https://www.credly.com/go/{match.group(1)}"

    return None


def run_verification(pdf_path, worker_data=None):
    """Main entry point — matches CertiGuard scraper interface."""
    from matcher import normalize_text, is_text_in_document, fuzzy_matcher, check_date_match

    # 1. Get text
    extracted_text = ""
    if worker_data and worker_data.get("text"):
        extracted_text = worker_data["text"]
    else:
        try:
            import PyPDF2
            with open(pdf_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                extracted_text = "".join(
                    page.extract_text() for page in reader.pages if page.extract_text()
                )
        except Exception:
            pass

    # Also get OCR text from worker
    if worker_data and worker_data.get("ocr_text"):
        extracted_text += "\n" + worker_data["ocr_text"]

    # 2. Find Credly URL
    credly_url = extract_credly_url(extracted_text, pdf_path)

    # Check QR codes from worker
    if not credly_url and worker_data and worker_data.get("qr_codes"):
        for qr in worker_data["qr_codes"]:
            if "credly" in qr.lower():
                credly_url = qr
                break

    if not credly_url:
        return "❌ No valid Credly/AWS Academy URL found in the certificate."

    # 3. Verify via Credly
    official_data = verify_aws(credly_url)

    if official_data["status"] != "Authentic":
        return f"❌ {official_data.get('reason', 'Verification failed')}"

    official_name = official_data.get("studentName", "")
    official_course = official_data.get("courseName", "")
    official_date = official_data.get("officialDate", "")

    # 4. Cross-check with PDF text
    norm_doc = normalize_text(extracted_text)

    if not is_text_in_document(official_name, norm_doc):
        return f"❌ Fake Certificate: Name mismatch\nVerified Name: {official_name}\nCourse: {official_course}\nURL: {credly_url}"

    # Course matching (strict then fuzzy)
    clean_course = re.sub(r'\s+', ' ', official_course.lower().strip())
    clean_doc = re.sub(r'\s+', ' ', extracted_text.lower().strip())
    if clean_course not in clean_doc:
        if not is_text_in_document(official_course, norm_doc):
            return f"❌ Fake Certificate: Course title mismatch\nName: {official_name}\nVerified Course: {official_course}\nURL: {credly_url}"

    # Date check
    if official_date:
        has_date_claim = bool(re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', extracted_text))
        if has_date_claim and not check_date_match(official_date, extracted_text):
            return f"❌ Fake Certificate: Date altered (Official: {official_date})\nName: {official_name}\nCourse: {official_course}\nURL: {credly_url}"

    # 5. Build success response
    details = f"\nDate: {official_date}" if official_date else ""
    return (
        f"✅ Valid AWS Academy Certificate\n"
        f"Name: {official_name}\n"
        f"Course: {official_course}\n"
        f"URL: {credly_url}{details}"
    )
