import udemy
import os

pdf_path = r"pdfs/Digital Electronics Udemy.pdf"
if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
else:
    print(f"--- Testing {pdf_path} ---")
    
    # 1. Test top-right URL extraction
    print("\n[1] Testing top-right URL extraction...")
    url = udemy.extract_top_right_url(pdf_path)
    print(f"Extracted URL: {url}")
    
    # 2. Test full verification run
    print("\n[2] Testing full verification logic...")
    # Note: run_verification will print INFO internally
    res = udemy.run_verification(pdf_path)
    print(f"Full Result: {res}")

