import re
import os

pdf_path = r"c:\Users\known\techstorm_nexus\pdfs\Digital Electronics Udemy.pdf"

if not os.path.exists(pdf_path):
    print(f"File not found: {pdf_path}")
    exit()

try:
    with open(pdf_path, "rb") as f:
        data = f.read()
    
    # Udemy IDs follow UC- followed by hexadecimal or alphanumeric with hyphens
    matches = re.findall(rb"UC-[a-zA-Z0-9-]+", data)
    if matches:
        print("Found matching patterns in stream:")
        for m in set(matches):
            print(m.decode())
    else:
        print("No UC- patterns found in binary stream.")
except Exception as e:
    print(f"Error reading file: {e}")
