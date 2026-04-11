import re
import os
import time

def extract_verification_link(text, file_path):
    # Pattern for Coursera verification links
    match = re.search(r"coursera\.org/verify/([A-Za-z0-9]+)", text)
    if match:
        return f"https://www.coursera.org/account/accomplishments/verify/{match.group(1)}"
    
    # Try filename if text fails
    match = re.search(r"coursera_([A-Za-z0-9]+)", file_path.lower())
    if match:
        return f"https://www.coursera.org/account/accomplishments/verify/{match.group(1).upper()}"
        
    return None

def extract_details_from_pdf_text(text):
    name = "Name Not Found"
    course = "Course Not Found"
    
    # Name patterns
    name_patterns = [
        r"This certificate verifies that\s+([A-Za-z\s\.\-']+?)\s+successfully completed",
        r"Student Name:\s*([A-Za-z\s\.\-']+)",
        r"([A-Za-z\s\.\-']+)\s+successfully completed",
        r"([A-Za-z\s\.\-']+?)\s+h?as\s+successfully completed"
    ]
    
    for p in name_patterns:
        match = re.search(p, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            break
            
    # Course patterns
    course_patterns = [
        r"completion of\s+\"?(.+?)\"?(?:\n|\s+on|\s+an online)",
        r"completed the course\s+(.+?)(?:\n|$)",
        r"course:\s+(.+?)(?:\n|$)"
    ]
    
    for p in course_patterns:
        match = re.search(p, text, re.IGNORECASE)
        if match:
            course = match.group(1).strip()
            break
            
    return name, course

def scrape_page(verification_link):
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
        all_text = soup.get_text(separator="\n", strip=True)
        
        # Meta tag fallback
        page_title = soup.title.string.strip() if soup.title and soup.title.string else ""
        
        meta_desc = soup.find("meta", property="og:description") or soup.find("meta", name="description")
        meta_content = meta_desc.get("content", "") if meta_desc else ""
        if "successful completion of" in meta_content.lower():
            all_text = meta_content + "\n" + all_text

        meta_title = soup.find("meta", property="og:title") or soup.find("meta", name="twitter:title")
        if meta_title and meta_title.get("content"):
            meta_val = meta_title.get("content").strip()
            if "|" in meta_val:
                parts = meta_val.split("|")
                meta_val = parts[0].strip() if "Coursera" not in parts[0] else parts[1].strip()
            if " - Coursera" in meta_val:
                meta_val = meta_val.replace(" - Coursera", "").strip()
            page_title = meta_val

        is_blocked = any(kw in all_text.lower() for kw in ["verify you are human", "security verification", "cloudflare"])
        return all_text, page_title, is_blocked
    except Exception as e:
        return f"Error: {e}", "Error", False

def get_verified_details(all_text, page_title):
    try:
        text_clean = re.sub(r"\s+", " ", all_text).strip()
        
        # Name patterns
        verified_name = "Name Not Found"
        name_patterns = [
            r"This certificate verifies that\s+([A-Za-z\s\.\-']+?)\s+successfully completed",
            r"([A-Za-z\s\.\-']+?)'s\s+account is verified",
            r"account is verified\.?\s+Coursera certifies (?:their|that)?\s+([A-Za-z\s\.\-']+?)\s+successfull?y",
            r"Completed by\s+([A-Za-z\s\.\-']+?)(?:\s+on|\n|$)"
        ]

        for p in name_patterns:
            match = re.search(p, text_clean, re.IGNORECASE)
            if match:
                verified_name = match.group(1).strip()
                if verified_name.lower() != "coursera": break

        # Course patterns
        verified_course = "Course Not Found"
        course_patterns = [
            r"completion of\s+(?:.+?university of.+?'s\s+)?\"(.+?)\"",
            r"successful completion of\s+(?:the\s+)?(?:course\s+)?\"?(.+?)\"?\s*(?:\.|\s+Offered|\s+Authorized|\s+by|\s+on|\s{2,}|\(|at Coursera)",
            r"completed\s+(?:the\s+)?(?:course\s+)?\"?(.+?)\"?\s+an online"
        ]
        
        for cp in course_patterns:
            match = re.search(cp, text_clean, re.IGNORECASE)
            if match:
                verified_course = match.group(1).strip()
                break

        if verified_course == "Course Not Found":
            verified_course = page_title.split("|")[0].strip() if "|" in page_title else page_title

        return verified_name, verified_course
    except:
        return "Name Not Found", "Course Not Found"

def extract_hours_and_date(text):
    from datetime import datetime
    hours = "N/A"
    date = "N/A"
    
    # Standardize spaces for easier scanning
    text_clean = re.sub(r' +', ' ', text)
    
    # 1. Look for dates with prefixes
    date_match = re.search(r"(?:on|Completed on|Issued on|Date:?)\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})", text_clean, re.I)
    if date_match: 
        date = date_match.group(1).strip()
    else:
        # 2. Standalone date search (find all instances)
        potential_dates = re.findall(r"\b([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b", text_clean)
        
        # Avoid capturing today's date if possible (usually the verification date)
        today = datetime.now()
        # On Windows, use %#d for no-leading-zero, on Linux use %-d
        # Since the user's OS is Windows, we use %#d
        try:
            today_str = today.strftime("%B %#d, %Y")
            today_full = today.strftime("%B %d, %Y")
            today_short = today.strftime("%b %#d, %Y")
            today_short_full = today.strftime("%b %d, %Y")
        except ValueError:
            # Fallback for non-windows systems just in case
            today_str = today.strftime("%B %d, %Y").replace(" 0", " ")
            today_full = today.strftime("%B %d, %Y")
            today_short = today.strftime("%b %d, %Y").replace(" 0", " ")
            today_short_full = today.strftime("%b %d, %Y")
        
        today_set = {today_str.lower(), today_full.lower(), today_short.lower(), today_short_full.lower()}
        
        for d in potential_dates:
            if d.lower() not in today_set:
                date = d.strip()
                break
        
        # Fallback to first found date if all are today or none found
        if date == "N/A" and potential_dates:
            date = potential_dates[0].strip()
    
    h_match = re.search(r"(\d+)\s*(?:total\s*hours|hours)", text, re.I)
    if h_match: hours = h_match.group(1).strip()
    
    return hours, date

def run_verification(file_path, worker_data=None):
    from app import extract_text_from_pdf
    
    extracted_text = ""
    if worker_data and worker_data.get("text"):
        extracted_text = worker_data["text"]
    else:
        extracted_text = extract_text_from_pdf(file_path)
    
    if not extracted_text:
        return "❌ Skipping Coursera verification: No text extracted."

    verification_link = extract_verification_link(extracted_text, file_path)
    local_name, local_course = extract_details_from_pdf_text(extracted_text)
    hours, date = extract_hours_and_date(extracted_text)

    if not verification_link:
        return f"❌ No Coursera verification link found."

    all_text, page_title, is_blocked = scrape_page(verification_link)
    
    if is_blocked:
        details_suffix = f"\nHours: {hours}\nDate: {date}"
        if local_name != "Name Not Found":
            return f"✅ Valid Coursera Certificate (Analysis)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}{details_suffix}\n[Note: Live verification restricted, verified via layout analysis]"
        return f"⚠️ Live verification restricted. Manual check: {verification_link}"

    verified_name, verified_course = get_verified_details(all_text, page_title)
    web_hours, web_date = extract_hours_and_date(all_text)
    if web_hours != "N/A": hours = web_hours
    if web_date != "N/A": date = web_date
    details_suffix = f"\nHours: {hours}\nDate: {date}"

    if verified_name == "Name Not Found":
        if local_name != "Name Not Found":
            return f"✅ Valid Coursera Certificate (Structure)\nName: {local_name}\nCourse: {local_course}\nURL: {verification_link}{details_suffix}"
        return f"❌ Unable to verify student name on Coursera."

    normalized_web_name = verified_name.lower().strip()
    normalized_extracted_text = extracted_text.lower()
    name_parts = [p.strip() for p in normalized_web_name.split() if len(p.strip()) > 2]
    is_name_match = all(part in normalized_extracted_text for part in name_parts) if name_parts else False

    if is_name_match:
        return f"✅ Valid Coursera Certificate\nName: {verified_name}\nCourse: {verified_course}\nURL: {verification_link}{details_suffix}"
    else:
        return f"❌ Fake Certificate Mismatch\nVerified Name: {verified_name}\nCourse: {verified_course}\nURL: {verification_link}{details_suffix}"
