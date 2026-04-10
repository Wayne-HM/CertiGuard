import os
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BIN_DIR = os.path.join(BASE_DIR, "bin")
TESSDATA_DIR = os.path.join(BASE_DIR, "tessdata")

os.makedirs(BIN_DIR, exist_ok=True)
os.makedirs(TESSDATA_DIR, exist_ok=True)

# Sources for Statically Linked Binaries
TESSERACT_BIN_URL = "https://github.com/DanielMYT/tesseract-static/releases/download/tesseract-5.5.2/tesseract.x86_64"
ENG_DATA_URL = "https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata"
LIBS = [] # Static binary doesn't need external libs

def download_file(url, dest):
    print(f"Downloading {url} to {dest}...")
    try:
        urllib.request.urlretrieve(url, dest)
        print("Success!")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    download_file(TESSERACT_BIN_URL, os.path.join(BIN_DIR, "tesseract"))
    download_file(ENG_DATA_URL, os.path.join(TESSDATA_DIR, "eng.traineddata"))
    for lib_url in LIBS:
        lib_name = lib_url.split("/")[-1]
        download_file(lib_url, os.path.join(BIN_DIR, lib_name))
    
    print("\nAssets prepared. You can now deploy the 'worker' folder to Vercel.")
