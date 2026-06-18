"""
CertiGuard — Cisco Networking Academy Certificate Verifier
Uses lightweight requests + BeautifulSoup (NO Playwright/Chromium).
"""

import re
import time
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
]


def scrape_cisco_page(url):
    import requests
    from bs4 import BeautifulSoup
    student_name = ""
    course_name = ""
    issue_date = ""
    headers = {"User-Agent": random.choice(USER_AGENTS), "Accept": "text/html,*/*;q=0.8"}

    try:
        response = requests.get(url, headers=headers, timeout=20, allow_redirects=True)
        final_url = response.url
        if response.status_code in [403, 429]:
            return {"status": "BotBlock"}
        if response.status_code != 200:
            return {"status": "Fake", "reason": f"HTTP {response.status_code}"}

        soup = BeautifulSoup(response.text, "html.parser")
        page_text = soup.get_text(separator="\n")
        html = response.text

        if "credly.com" in final_url:
            nm = re.search(r'This badge was issued to\s*<a[^>]*>([^<]+)</a>', html, re.I)
            if not nm:
                nm = re.search(r'This badge was issued to\s*([A-Za-z\s]+)', page_text, re.I)
            if nm: student_name = nm.group(1).strip()

            h1 = soup.find("h1")
            if h1: course_name = h1.get_text(strip=True)
            if not course_name:
                cm = re.search(r'((?:Cisco|CCNA|CCNP|CyberOps)[^\n]+)', page_text, re.I)
                if cm: course_name = cm.group(1).strip()

            dm = re.search(r'Date issued:\s*([^<\n]+)', html, re.I)
            if dm: issue_date = dm.group(1).strip()
        else:
            nm = re.search(r'(?:Name|Student|Issued to)[:\s]+([A-Za-z\s]+)', page_text, re.I)
            if nm: student_name = nm.group(1).strip()
            cm = re.search(r'(?:Course|Certificate of Completion for)\s*[:\s]+([^\n]+)', page_text, re.I)
            if cm: course_name = cm.group(1).strip()
            dm = re.search(r'([A-Za-z]+\s+\d{1,2},?\s+\d{4})', page_text)
            if dm: issue_date = dm.group(1).strip()
    except Exception as e:
        return {"status": "Fake", "reason": f"Network error: {str(e)}"}

    if student_name and course_name:
        r = {"status": "Authentic", "studentName": student_name, "courseName": course_name}
        if issue_date: r["officialDate"] = issue_date
        return r
    return {"status": "Fake", "reason": "Could not parse Cisco verification page."}


def verify_cisco(url):
    for attempt in range(3):
        result = scrape_cisco_page(url)
        if result.get("status") == "BotBlock" and attempt < 2:
            time.sleep(random.uniform(2.0, 4.0))
            continue
        return result
    return {"status": "Fake", "reason": "Blocked after multiple attempts."}


def extract_cisco_url(text, pdf_path="", worker_data=None):
    if worker_data and worker_data.get("qr_codes"):
        for qr in worker_data["qr_codes"]:
            if any(k in qr.lower() for k in ["credly", "cisco", "netacad"]):
                return qr
    m = re.search(r'(https?://[^\s]*credly\.com/[^\s]+)', text, re.I)
    if m: return m.group(1).strip()
    m = re.search(r'(credly\.com/(?:go|badges)/[A-Za-z0-9\-]+)', text)
    if m: return "https://www." + m.group(1)
    m = re.search(r'(https?://[^\s]*(?:cisco|netacad)\.[^\s]+)', text, re.I)
    if m: return m.group(1).strip()
    return None


def run_verification(pdf_path, worker_data=None):
    from matcher import smart_match, fuzzy_matcher, check_date_match
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

    cisco_url = extract_cisco_url(extracted_text, pdf_path, worker_data)
    if not cisco_url:
        return "❌ No valid Cisco/Credly URL or QR code found."

    data = verify_cisco(cisco_url)
    if data["status"] != "Authentic":
        return f"❌ {data.get('reason', 'Verification failed')}"

    name = data.get("studentName", "")
    course = data.get("courseName", "")
    date = data.get("officialDate", "")

    if not smart_match(name, extracted_text, is_ocr):
        return f"❌ Fake Certificate: Name mismatch\nVerified Name: {name}\nCourse: {course}\nURL: {cisco_url}"

    cc = re.sub(r'\s+', '', course.lower())
    cd = re.sub(r'\s+', '', extracted_text.lower())
    if cc not in cd and (not is_ocr or not fuzzy_matcher(course, extracted_text, 80)):
        return f"❌ Fake Certificate: Course mismatch\nName: {name}\nVerified Course: {course}\nURL: {cisco_url}"

    if date:
        dp = re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', extracted_text.lower())
        if dp and not check_date_match(date, extracted_text):
            return f"❌ Fake Certificate: Date altered (Official: {date})\nName: {name}\nCourse: {course}\nURL: {cisco_url}"

    det = f"\nDate: {date}" if date else ""
    return f"✅ Valid Cisco Certificate\nName: {name}\nCourse: {course}\nURL: {cisco_url}{det}"
