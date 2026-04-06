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
    options = webdriver.ChromeOptions()
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

    try:
        driver.get(cert_url)
        time.sleep(3)

        verify_button = driver.find_element(By.XPATH, "//input[@type='submit' and @value='Verify']")
        verify_button.click()
        time.sleep(3)

        verified_name = driver.find_element(By.XPATH, "//td[text()='Full name']/following-sibling::td").text.strip()
        verified_course = driver.find_element(By.XPATH, "//td[text()='Certificate']/following-sibling::td").text.strip()

        normalized_web_name = verified_name.lower().strip()
        normalized_web_course = verified_course.lower().strip()
        normalized_extracted_text = extracted_text.lower()
        
        name_match = (normalized_web_name in normalized_extracted_text) or all(part in normalized_extracted_text for part in normalized_web_name.split() if len(part) > 2)
        course_match = normalized_web_course in normalized_extracted_text

        if name_match:
            return (
                f"✅ Valid Saylor Certificate\n"
                f"Name: {verified_name}\n"
                f"Course: {verified_course}\n"
                f"URL: {cert_url}"
            )
        else:
            return (
                f"❌ Fake Certificate Mismatch\n"
                f"Verified Name: {verified_name}\n"
                f"Course: {verified_course}\n"
                f"URL: {cert_url}"
            )

    except Exception as e:
        return f"❌ Error during verification: {e}"
    finally:
        driver.quit()

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
