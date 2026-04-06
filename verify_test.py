import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

import coursera
import udemy
import alison
import saylor

test_cases = [
    ("Coursera", "pdfs/Coursera DG2FME3U9XXY.pdf", coursera),
    ("Coursera (Failing)", "pdfs/Coursera RG4DLK8JHPWX.pdf", coursera),
    ("Udemy (Image-based)", "pdfs/Digital Electronics Udemy.pdf", udemy),
    ("Alison", "pdfs/Alison_Certificate-1447-15764499 (1).pdf", alison),
    ("Saylor", "pdfs/saylor 2303A51249.pdf", saylor)
]

print("=== CertiGuard Stabilization Test ===")

for platform, path, module in test_cases:
    print(f"\nTesting {platform}...")
    try:
        result = module.run_verification(path)
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")

print("\n=== Test Finished ===")
