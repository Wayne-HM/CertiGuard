# Start with Python slim image
FROM python:3.11-slim-bullseye

# Install system packages (Restored tesseract-ocr, moved from easyocr)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzbar0 \
    tesseract-ocr \
    libglib2.0-0 \
    curl \
    unzip \
    wget \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    libx11-xcb1 \
    xvfb \
    chromium \
    chromium-driver \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all other files
COPY . .

# Run app with 1 worker to stay within the 512MB RAM limit of Render free tier
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000", "--timeout", "180", "--workers", "1"]
