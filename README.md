# CertiGuard - Certificate Verification System

CertiGuard is a modern, full-stack web application designed to automatically verify whether online course certificates are genuine or fake. It supports multiple platforms and can verify certificates either via PDF upload, web scraping, or OCR image analysis.

The system features a sleek **Next.js** frontend with an interactive UI, and a powerful **Python/Flask** backend that handles the heavy lifting of reading QR codes, extracting data, and validating authenticity.

---

## 🌟 Key Features

* **Platform Detection**: Automatically identifies the certificate's issuing platform (Coursera, Udemy, Alison, Saylor Academy, etc.).
* **Multiple Verification Methods**:
  * PDF data parsing & metadata extraction
  * Text/Image OCR for scanned certificates
  * QR Code scanning support
  * Fallback to direct URL scraping using Selenium
* **Modern Frontend**: Built with Next.js 16, React 19, Tailwind CSS v4, and Radix UI components.
* **Smart UI**: Interactive dashboard, smooth animations (Framer Motion), dark mode support (next-themes), and responsive layout.

---

## 🛠 Project Architecture

This application consists of two main parts residing in the same repository:

1. **Frontend (Next.js)**: Handles user uploads, status updates, and displaying verification reports.
2. **Backend (Flask API)**: Python scripts (`app.py`, `coursera.py`, `udemy.py`, etc.) that process the uploaded files and return verification results.

### Directory Overview
```
CertiGuard/
├── app/                  # Next.js frontend application (React 19)
├── components/           # Reusable Radix UI & generic components
├── public/               # Static frontend assets
├── .next/                # Build output for Next.js
│
├── app.py                # Main Flask API entry point
├── coursera.py           # Coursera verification logic
├── udemy.py              # Udemy verification logic
├── alison.py             # Alison verification logic
├── saylor.py             # Saylor verification logic
│
├── uploads/              # Temporary storage for uploaded certificates
├── pdfs/                 # Cached PDF storage
└── requirements.txt      # Python dependencies
```

---

## 🚀 Getting Started

### Prerequisites

You will need the following installed:
* **Node.js**: v18 or higher (for the frontend)
* **Python**: v3.9 or higher (for the backend)
* **Google Chrome & ChromeDriver**: Used by Selenium for web scraping pages that require JavaScript.
* **Tesseract OCR**: Required for image-based text extraction. (Download: [Tesseract Github](https://github.com/tesseract-ocr/tesseract))

---

### 1. Setup the Python Backend

1. Open a terminal in the project root.
2. Create and activate a Virtual Environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask API:
   ```bash
   python app.py
   ```
   *The Flask API typically runs on `http://127.0.0.1:5000`.*

---

### 2. Setup the Next.js Frontend

1. Open a **new** terminal in the project root.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`.

---

## 🧠 Supported Platforms

Currently, the backend validation modules support the following certification platforms:

* **Coursera** (`coursera.py`)
* **Udemy** (`udemy.py`)
* **Alison** (`alison.py`)
* **Saylor Academy** (`saylor.py`)
* *(Infosys, etc. logic are frequently updated modules)*

The platform is dynamically inferred by analyzing the certificate's visual content, structural text, or embedded QR code data.

---

## 🔮 Future Improvements

- Containerize the entire application using Docker (a `Dockerfile` is present in the repository).
- Improve Cloudflare bypass handling in the scraping modules.
- Enhance OCR accuracy for low-resolution certificates.
- Add history tracking for previously verified certificates.

---

## 📄 License

This project is licensed under the MIT License.
