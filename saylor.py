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
    studentName = ""
    courseName = ""
    grade = ""
    hours = ""
    issueDate = ""
    
    certUrl = f"https://learn.saylor.org/admin/tool/certificate/index.php?code={saylorId}"
    
    # --- System Binary Detection ---
    linux_paths = ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]
    win_paths = [r"C:\Program Files\Google\Chrome\Application\chrome.exe", r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"]
    
    executable_path = None
    for path in (linux_paths + win_paths):
        if os.path.exists(path):
            executable_path = path
            break

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        launch_args = {"headless": True}
        if executable_path:
            launch_args["executable_path"] = executable_path
            
        browser = p.chromium.launch(**launch_args)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        try:
            page.goto(certUrl, wait_until="domcontentloaded", timeout=15000)
            
            try:
                # Handle the interactive "Verify" button if it exists
                verify_btn = page.locator("button:has-text('Verify'), input[value='Verify']").first
                if verify_btn.count() > 0:
                    verify_btn.click(timeout=3000)
                    page.wait_for_selector("text=This certificate is valid", timeout=8000)
            except:
                pass
            
            # Tighten wait times
            page.wait_for_timeout(1000)
            
            pageText = page.inner_text("body")

            
            # FAST-FAIL: If the ID is completely invalid
            if "this certificate is valid" not in pageText.lower():
                browser.close()
                return "❌ Saylor reported this Certificate ID as invalid or not found."
                
            all_cells = page.locator("td, th").all_inner_texts()
            for i, text in enumerate(all_cells):
                clean_text = text.lower().replace(':', '').strip()
                if clean_text in ["full name", "name", "student", "student name", "participant"] and i + 1 < len(all_cells):
                    studentName = all_cells[i+1].strip()
                if clean_text in ["certificate", "course", "course name", "program"] and i + 1 < len(all_cells):
                    courseName = all_cells[i+1].strip()

            if not studentName or studentName.lower() in ["full name", "name"]:
                m1 = re.search(r'(?:full name|name|student)\s*[:\-]*\s*([^\n]+)', pageText, re.IGNORECASE)
                if m1: studentName = m1.group(1).strip()
                
            if not courseName or courseName.lower() in ["certificate", "course"]:
                m2 = re.search(r'(?:certificate|course)\s*[:\-]*\s*([^\n]+)', pageText, re.IGNORECASE)
                if m2: courseName = m2.group(1).strip()

            # Store cookies and close browser BEFORE PDF download to save RAM
            if studentName and courseName:
                cookies = context.cookies()
                cookies_dict = {c['name']: c['value'] for c in cookies}
            else:
                cookies_dict = {}

        except Exception as e:
            print(f"DEBUG: Saylor Playwright error: {e}")
            cookies_dict = {}
            
        browser.close()

        
    # Free browser memory before starting PDF/ Fitz processing
    gc.collect()

    # Step 2: Handle PDF deep inspection (only if browser phase was successful)
    if studentName and courseName and cookies_dict:
        import requests
        import fitz
        try:
            pdf_verification_url = f"https://learn.saylor.org/admin/tool/certificate/view.php?code={saylorId}"
            headers = {'User-Agent': 'Mozilla/5.0'}
            
            response = requests.get(pdf_verification_url, headers=headers, cookies=cookies_dict, timeout=12)
            
            if response.status_code == 200 and b"%PDF" in response.content[:5]:
                tempPdfPath = f"temp_saylor_{saylorId}.pdf"
                with open(tempPdfPath, "wb") as f:
                    f.write(response.content)
                    
                doc = fitz.open(tempPdfPath)
                officialText = ""
                for i in range(len(doc)):
                    officialText += doc.load_page(i).get_text() + " \n "
                doc.close()
                if os.path.exists(tempPdfPath):
                    os.remove(tempPdfPath)
                
                gradeMatches = re.findall(r'\b\d{1,3}\.\d{2}\b', officialText)
                if gradeMatches: grade = gradeMatches[-1]
                    
                hoursMatch = re.search(r'(\d+(?:\.\d+)?)\s*Hours', officialText, re.IGNORECASE)
                if hoursMatch: hours = hoursMatch.group(1).strip()
                    
                dateMatch = re.search(r'(\d{1,2}\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},\s+\d{4})', officialText)
                if dateMatch: issueDate = dateMatch.group(1).strip()
        except Exception as e:
            print(f"DEBUG: Saylor PDF extraction error: {e}")
        finally:
            gc.collect()

        
    if studentName and courseName:
        details_suffix = ""
        if grade: details_suffix += f"\nGrade: {grade}%"
        if hours: details_suffix += f"\nHours: {hours}"
        if issueDate: details_suffix += f"\nDate: {issueDate}"
        
        return (
            f"✅ Valid Saylor Certificate\n"
            f"Name: {studentName}\n"
            f"Course: {courseName}\n"
            f"URL: {certUrl}{details_suffix}"
        )
        
    return "❌ Could not parse Name/Course from official Saylor verification records."


def run_verification(pdf_path):
    import fitz
    # Standard Saylor extraction
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

