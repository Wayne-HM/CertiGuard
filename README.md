#  Fake Certificate Verification System

A web-based certificate verification system built using Flask.
The application allows users to upload a certificate PDF and automatically verifies whether the certificate is genuine or fake.

The system analyzes the uploaded certificate, detects the issuing platform, extracts relevant information such as the student name and course title, and verifies the data against official verification sources.

---

## Overview

Many online learning platforms provide certificates that include verification links or QR codes.
This project automates the process of checking certificate authenticity by extracting information from the PDF and validating it through platform-specific verification methods.

The system currently supports verification for multiple platforms such as:

* Coursera
* Udemy
* Alison
* Saylor Academy


The platform is automatically detected based on certificate content or QR data.

---

## Features

* Upload and verify certificate PDFs through a web interface
* Automatic detection of certification platform
* QR code extraction from certificates
* Text extraction from PDF files
* OCR support for image-based certificates
* Web scraping for verification pages using Selenium
* Platform-specific verification modules

---

## How the System Works

1. A user uploads a certificate PDF through the web interface.
2. The Flask server saves the file and analyzes its content.
3. The system detects the certificate platform by checking:

   * Text content
   * QR code data
   * Verification links
4. The corresponding verification module is executed.
5. The module extracts certificate details and validates them against official sources.
6. The result is returned to the user indicating whether the certificate is valid or fake.

---

## Technologies Used

* Python
* Flask
* Selenium
* PyMuPDF
* PyPDF2
* Pyzbar
* Pillow
* Tesseract OCR
* BeautifulSoup
* WebDriver Manager

---

## Project Structure

```id="x8b1ov"
project/
│
├── app.py                # Main Flask application
├── coursera.py           # Coursera certificate verification
├── udemy.py              # Udemy certificate verification
├── alison.py             # Alison certificate verification
├── saylor.py             # Saylor certificate verification

│
├── templates/
│   ├── index.html
│   └── result.html
│
├── uploads/              # Uploaded certificate files
├── requirements.txt
```

---

## Installation

Clone the repository:

```id="x6av9m"
git clone https://github.com/yourusername/certificate-verification-system.git
cd certificate-verification-system
```

Install dependencies:

```id="df85d3"
pip install -r requirements.txt
```

---

## Additional Requirements

Some verification modules require external tools.

### Install Tesseract OCR

Download and install Tesseract:

https://github.com/tesseract-ocr/tesseract

Update the path in the code if required.

### Install Chrome and ChromeDriver

Selenium is used to interact with verification pages.
Make sure Chrome and ChromeDriver are installed and accessible.

---

## Running the Application

Start the Flask server:

```id="k63mcl"
python app.py
```

Open your browser and visit:

```id="nruy8r"
http://127.0.0.1:5000
```

Upload a certificate PDF to begin verification.

---

## Example Workflow

1. Upload a certificate file.
2. The system extracts text or QR information.
3. The certificate platform is identified automatically.
4. Verification logic for that platform is executed.
5. The system displays whether the certificate is authentic or fake.

---

## Future Improvements

* Support for additional certification platforms
* Faster verification using API-based validation
* Improved OCR accuracy
* Batch verification for multiple certificates
* Better UI and reporting features

---

## License

This project is released under the MIT License.

---

## Author

Koushal
Computer Science Student and Developer interested in AI, automation, and web systems.
