import re
import time
import os
import gc


def extract_text_from_pdf(pdf_path, worker_data=None):
    text = ""
    links = []
    
    if worker_data and worker_data.get("text"):
        text = worker_data["text"]
    
    # Lightweight local fallback for text AND link extraction
    import PyPDF2
    try:
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            # Text extraction
            if not text:
                text = "".join(page.extract_text() for page in reader.pages if page.extract_text())
            
            # Link extraction
            for page in reader.pages:
                if '/Annots' in page:
                    for annot in page['/Annots']:
                        obj = annot.get_object()
                        if isinstance(obj, dict) and '/A' in obj and '/URI' in obj['/A']:
                            links.append(obj['/A']['/URI'])
    except Exception as e:
        print(f"DEBUG: Saylor local PDF extraction error: {e}")
        pass
        
    return text, links


def normalize_text(text):
    return re.sub(r'\s+|\.', ' ', text).strip().upper()


def verify_saylor(saylorId, pdfUrl):
    """Lightweight Saylor verification using requests + BeautifulSoup. No browser needed."""
    import requests
    from bs4 import BeautifulSoup

    studentName = ""
    courseName = ""
    grade = ""
    hours = ""
    issueDate = ""

    certUrl = f"https://learn.saylor.org/admin/tool/certificate/index.php?code={saylorId}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        # Step 1: GET the verification page
        session = requests.Session()
        session.headers.update(headers)

        print(f"DEBUG: Saylor verification for ID={saylorId}")
        response = session.get(certUrl, timeout=15)

        if response.status_code != 200:
            return f"❌ Saylor returned HTTP {response.status_code}."

        soup = BeautifulSoup(response.text, "html.parser")
        page_text = soup.get_text(separator="\n")

        # Moodle/Saylor specific: Extract sesskey if not already found in form
        sesskey = ""
        # 1. Search in links
        sess_match = re.search(r'sesskey=([A-Z0-9a-z]+)', response.text)
        if sess_match:
            sesskey = sess_match.group(1)
        
        # 2. Search in JS config
        if not sesskey:
            js_match = re.search(r'"sesskey":"([A-Z0-9a-z]+)"', response.text)
            if js_match:
                sesskey = js_match.group(1)

        # Check for the "Verify" form - specifically search for the one with the verification input
        form = None
        all_forms = soup.find_all("form")
        for f in all_forms:
            if f.find("input", {"id": "id_code"}) or f.find("button", {"id": "id_verify"}):
                form = f
                break
        
        # Fallback to current ID if still not found
        if not form:
            form = soup.find("form", {"id": "mform1"}) # Common Moodle form ID
            
        if form and "this certificate is valid" not in page_text.lower():
            # Build form data and POST
            form_data = {}
            for inp in form.find_all(["input", "button"]):
                name = inp.get("name")
                if not name: continue
                # Important: If it's a submit button, we MUST include its value to trigger the action
                if inp.get("type") == "submit" or inp.get("id") == "id_verify":
                    form_data[name] = inp.get("value", "Verify")
                else:
                    form_data[name] = inp.get("value", "")

            # Ensure mandatory Moodle/Saylor fields are present
            form_data['code'] = saylorId
            if sesskey: form_data['sesskey'] = sesskey
            form_data['mform_is_submitted_admin_tool_certificate_verify_form'] = '1'

            # Determine form action URL
            action = form.get("action", certUrl)
            if action and not action.startswith("http"):
                from urllib.parse import urljoin
                action = urljoin(certUrl, action)

            print(f"DEBUG: Saylor submitting verification form to {action} with sesskey={sesskey}")
            post_response = session.post(action, data=form_data, timeout=15)

            if post_response.status_code == 200:
                soup = BeautifulSoup(post_response.text, "html.parser")
                page_text = soup.get_text(separator="\n")

        # FAST-FAIL: If the ID is completely invalid
        if "this certificate is valid" not in page_text.lower():
            return "❌ Saylor reported this Certificate ID as invalid or not found."

        # Extract data from table cells or divs
        extracted_data = {}
        for row in soup.find_all(["tr", "div"]):
            row_text = row.get_text(separator=" ", strip=True)
            # Match "Label: Value" patterns
            m = re.search(r"(Full name|Name|Certificate|Course|Date issued|Date|Issued on)[:\s]+(.+)", row_text, re.I)
            if m:
                label = m.group(1).lower().replace('issued', '').strip() # Normalize to just 'date' or 'name'
                val = m.group(2).strip()
                extracted_data[label] = val

        if "full name" in extracted_data: studentName = extracted_data["full name"]
        elif "name" in extracted_data: studentName = extracted_data["name"]
        
        if "certificate" in extracted_data: courseName = extracted_data["certificate"]
        elif "course" in extracted_data: courseName = extracted_data["course"]

        if "date" in extracted_data: issueDate = extracted_data["date"]

        # Final table-based search if above missed
        if not studentName or not courseName or not issueDate:
            for table in soup.find_all("table"):
                cells = [td.get_text(strip=True) for td in table.find_all(["td", "th"])]
                for i, text in enumerate(cells):
                    clean_text = text.lower().replace(':', '').strip()
                    if clean_text in ["full name", "name", "student"] and i + 1 < len(cells):
                        studentName = studentName or cells[i+1].strip()
                    if clean_text in ["certificate", "course"] and i + 1 < len(cells):
                        courseName = courseName or cells[i+1].strip()
                    if "date" in clean_text and i + 1 < len(cells):
                        issueDate = issueDate or cells[i+1].strip()

        # Step 2: PDF extraction for grade/hours/date disabled locally
        # Use worker data if we were to support this, or fallback to web scraping
        pass

    except Exception as e:
        print(f"DEBUG: Saylor verification error: {e}")
        return f"❌ Error verifying Saylor certificate: {str(e)}"

    if studentName and courseName:
        details_suffix = ""
        if grade:
            details_suffix += f"\nGrade: {grade}%"
        if hours:
            details_suffix += f"\nHours: {hours}"
        if issueDate:
            details_suffix += f"\nDate: {issueDate}"

        return (
            f"✅ Valid Saylor Certificate\n"
            f"Name: {studentName}\n"
            f"Course: {courseName}\n"
            f"URL: {certUrl}{details_suffix}"
        )

    return "❌ Could not parse Name/Course from official Saylor verification records."


def run_verification(pdf_path, worker_data=None):
    extracted_text, links = extract_text_from_pdf(pdf_path, worker_data)
    
    # 1. Check for official Verify Link first (Higher Priority as per user)
    saylor_link = None
    for link in links:
        if "learn.saylor.org" in link and "code=" in link:
            saylor_link = link
            break
    
    cert_id = None
    if saylor_link:
        m = re.search(r"code=([A-Z0-9]{8,20})", saylor_link, re.I)
        if m:
            cert_id = m.group(1).strip()
            print(f"DEBUG: Found Saylor URL in PDF: {saylor_link}")

    # Fallback to text search if no link found
    if not cert_id:
        if not extracted_text:
            return "❌ Skipping Saylor verification: Worker data unavailable and local processing failed."

        # Try to find specifically labeled ID
        cert_id_match = re.search(r"(?:code|id|certificate id|verification code)[:\s]*([A-Z0-9]{8,18})", extracted_text, re.I)
        if not cert_id_match:
            # Fallback to general alphanumeric search
            cert_id_match = re.search(r"\b([A-Z0-9]{10,15}[A-Z]{0,2})\b", extracted_text)
        
        cert_id = cert_id_match.group(1).strip() if cert_id_match else None

        if not cert_id:
            filename = pdf_path.split("/")[-1].split("\\")[-1]
            cert_id_match = re.search(r"([A-Z0-9]{10,15})", filename)
            cert_id = cert_id_match.group(1).strip() if cert_id_match else None

    if not cert_id:
        print(f"DEBUG: Saylor ID not found in text/links (length {len(extracted_text)})")
        return "❌ Could not find a valid Saylor Certificate ID or verification link in the PDF data."

    print(f"DEBUG: Identified Saylor ID for verification: {cert_id}")
    return verify_saylor(cert_id, pdf_path)
