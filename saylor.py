import fitz  # PyMuPDF
import re
import time
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    return "\n".join([page.get_text("text") for page in doc])

def normalize_text(text):
    return re.sub(r'\s+|\.', ' ', text).strip().upper()

def verify_certificate(cert_url, extracted_text):
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    })

    try:
        # Step 1: GET the verification page to obtain the sesskey
        response = session.get("https://learn.saylor.org/admin/tool/certificate/index.php")
        if response.status_code != 200:
            return f"❌ Saylor verification page unavailable ({response.status_code})."

        # Extract sesskey using regex from the page source
        # Usually found in "sesskey":"..." in JS config or hidden inputs
        sesskey_match = re.search(r'\"sesskey\":\"(.*?)\"', response.text)
        if not sesskey_match:
            # Fallback to looking for hidden input
            soup = BeautifulSoup(response.text, 'html.parser')
            sesskey_input = soup.find('input', {'name': 'sesskey'})
            sesskey = sesskey_input['value'] if sesskey_input else None
        else:
            sesskey = sesskey_match.group(1)

        if not sesskey:
            return "❌ Unable to establish a secure session with Saylor Academy."

        # Extract cert_id from URL
        cert_id = cert_url.split("code=")[-1]

        # Step 2: POST to verify
        payload = {
            "code": cert_id,
            "sesskey": sesskey,
            "_qf__tool_certificate_verify_certificate_form": "1",
            "mform_is_submitted_tool_certificate_verify_certificate_form": "1",
            "verify": "Verify"
        }

        post_response = session.post("https://learn.saylor.org/admin/tool/certificate/index.php", data=payload)
        
        if post_response.status_code != 200:
            return f"❌ Saylor verification failed with status {post_response.status_code}."

        soup = BeautifulSoup(post_response.text, 'html.parser')
        
        # Check if verification results exist
        result_table = soup.find('table', {'class': 'generaltable'})
        if not result_table:
            if "Verification failed" in post_response.text or "not found" in post_response.text.lower():
                return f"❌ Saylor reported this Certificate ID as invalid: {cert_id}"
            return "❌ Could not parse Saylor verification results."

        # Extract name and course from the table
        rows = result_table.find_all('tr')
        details = {}
        for row in rows:
            cols = row.find_all('td')
            if len(cols) == 2:
                key = cols[0].text.strip().lower()
                val = cols[1].text.strip()
                details[key] = val

        verified_name = details.get('full name', 'Name Not Found')
        verified_course = details.get('certificate', 'Course Not Found')
        verified_date = details.get('course completed', 'N/A')
        
        # Heuristic for Saylor hours (usually course duration is mentioned in the PDF or table)
        verified_hours = details.get('duration', 'N/A')

        normalized_web_name = verified_name.lower().strip()
        normalized_extracted_text = extracted_text.lower()
        
        # Name matching logic
        name_parts = [p.strip() for p in normalized_web_name.split() if len(p.strip()) > 2]
        if not name_parts: name_parts = [p.strip() for p in normalized_web_name.split() if len(p.strip()) > 1]
        
        name_match = all(part in normalized_extracted_text for part in name_parts)
        details_suffix = f"\nHours: {verified_hours}\nDate: {verified_date}"

        if name_match:
            return (
                f"✅ Valid Saylor Certificate\n"
                f"Name: {verified_name}\n"
                f"Course: {verified_course}\n"
                f"URL: {cert_url}{details_suffix}"
            )
        else:
            return (
                f"❌ Fake Certificate Mismatch\n"
                f"Verified Name: {verified_name}\n"
                f"Course: {verified_course}\n"
                f"URL: {cert_url}{details_suffix}"
            )

    except Exception as e:
        return f"❌ Error during requests verification: {e}"

def run_verification(pdf_path):
    extracted_text = extract_text_from_pdf(pdf_path)
    # Alphanumeric ID detection (e.g. 5382377942SM)
    cert_id_match = re.search(r"\b([A-Z0-9]{8,15})\b", extracted_text)
    cert_id = cert_id_match.group(1).strip() if cert_id_match else None
    
    if not cert_id:
        filename = pdf_path.split("/")[-1].split("\\")[-1]
        cert_id_match = re.search(r"\b([A-Z0-9]{8,15})\b", filename)
        cert_id = cert_id_match.group(1).strip() if cert_id_match else None

    if not cert_id:
        return "❌ Could not find a valid Saylor Certificate ID in the PDF or Filename."
        
    cert_url = f"https://learn.saylor.org/admin/tool/certificate/index.php?code={cert_id}"
    return verify_certificate(cert_url, extracted_text)
