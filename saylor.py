import re
import time
import os
import gc


def extract_text_from_pdf(pdf_path):
    import fitz
    doc = fitz.open(pdf_path)
    text = "\n".join([page.get_text("text") for page in doc])
    doc.close()
    return text


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

        # Check if we need to submit a verify form
        form = soup.find("form")
        if form and "this certificate is valid" not in page_text.lower():
            # Build form data and POST
            form_data = {}
            for inp in form.find_all("input"):
                name = inp.get("name")
                value = inp.get("value", "")
                if name:
                    form_data[name] = value

            # Determine form action URL
            action = form.get("action", certUrl)
            if action and not action.startswith("http"):
                from urllib.parse import urljoin
                action = urljoin(certUrl, action)

            print(f"DEBUG: Saylor submitting form to {action}")
            post_response = session.post(action, data=form_data, timeout=15)

            if post_response.status_code == 200:
                soup = BeautifulSoup(post_response.text, "html.parser")
                page_text = soup.get_text(separator="\n")

        # FAST-FAIL: If the ID is completely invalid
        if "this certificate is valid" not in page_text.lower():
            return "❌ Saylor reported this Certificate ID as invalid or not found."

        # Extract data from table cells
        for table in soup.find_all("table"):
            cells = [td.get_text(strip=True) for td in table.find_all(["td", "th"])]
            for i, text in enumerate(cells):
                clean_text = text.lower().replace(':', '').strip()
                if clean_text in ["full name", "name", "student", "student name", "participant"] and i + 1 < len(cells):
                    studentName = cells[i+1].strip()
                if clean_text in ["certificate", "course", "course name", "program"] and i + 1 < len(cells):
                    courseName = cells[i+1].strip()

        # Regex fallback from page text
        if not studentName or studentName.lower() in ["full name", "name"]:
            m1 = re.search(r'(?:full name|name|student)\s*[:\-]*\s*([^\n]+)', page_text, re.IGNORECASE)
            if m1:
                studentName = m1.group(1).strip()

        if not courseName or courseName.lower() in ["certificate", "course"]:
            m2 = re.search(r'(?:certificate|course)\s*[:\-]*\s*([^\n]+)', page_text, re.IGNORECASE)
            if m2:
                courseName = m2.group(1).strip()

        # Step 2: Try to fetch official PDF for grade/hours/date
        if studentName and courseName:
            try:
                import fitz
                pdf_url = f"https://learn.saylor.org/admin/tool/certificate/view.php?code={saylorId}"
                pdf_response = session.get(pdf_url, timeout=12)

                if pdf_response.status_code == 200 and b"%PDF" in pdf_response.content[:5]:
                    tempPdfPath = f"temp_saylor_{saylorId}.pdf"
                    with open(tempPdfPath, "wb") as f:
                        f.write(pdf_response.content)

                    doc = fitz.open(tempPdfPath)
                    officialText = ""
                    for i in range(len(doc)):
                        officialText += doc.load_page(i).get_text() + " \n "
                    doc.close()

                    if os.path.exists(tempPdfPath):
                        os.remove(tempPdfPath)

                    gradeMatches = re.findall(r'\b\d{1,3}\.\d{2}\b', officialText)
                    if gradeMatches:
                        grade = gradeMatches[-1]

                    hoursMatch = re.search(r'(\d+(?:\.\d+)?)\s*Hours', officialText, re.IGNORECASE)
                    if hoursMatch:
                        hours = hoursMatch.group(1).strip()

                    dateMatch = re.search(r'(\d{1,2}\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},\s+\d{4})', officialText)
                    if dateMatch:
                        issueDate = dateMatch.group(1).strip()
            except Exception as e:
                print(f"DEBUG: Saylor PDF extraction error: {e}")
            finally:
                gc.collect()

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


def run_verification(pdf_path):
    import fitz
    doc = fitz.open(pdf_path)
    extracted_text = "\n".join([page.get_text("text") for page in doc])
    doc.close()

    # Alphanumeric ID detection (e.g. 5382377942SM)
    cert_id_match = re.search(r"\b([A-Z0-9]{8,15})\b", extracted_text)
    cert_id = cert_id_match.group(1).strip() if cert_id_match else None

    if not cert_id:
        filename = pdf_path.split("/")[-1].split("\\")[-1]
        cert_id_match = re.search(r"\b([A-Z0-9]{8,15})\b", filename)
        cert_id = cert_id_match.group(1).strip() if cert_id_match else None

    if not cert_id:
        return "❌ Could not find a valid Saylor Certificate ID in the PDF or Filename."

    return verify_saylor(cert_id, pdf_path)
