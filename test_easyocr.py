import sys
from udemy import run_verification
import os

pdf_path = "UC 5.5H Hands On Python Data Science- Data Science Bootcamp-08e7644d-1b2e-4ad1-ad71-580a9cc7d26b.pdf"

if not os.path.exists(pdf_path):
    print(f"Error: {pdf_path} not found.")
    sys.exit(1)

print(f"Testing EasyOCR verification on: {pdf_path}")
try:
    result = run_verification(pdf_path)
    print("\n--- TEST RESULT ---")
    print(result)
except Exception as e:
    print(f"\n--- TEST FAILED ---")
    print(f"Error: {e}")
    print("\nNote: This might be due to missing EasyOCR/Torch dependencies in the test environment.")
