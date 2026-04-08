# Start with Python slim image
FROM python:3.11-slim-bullseye

# Install system packages (Removed tesseract, added libgl1 for EasyOCR/OpenCV)
RUN apt-get update && apt-get install -y \
    libzbar0 \
    libgl1 \
    curl \
    unzip \
    wget \
    libglib2.0-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    libx11-xcb1 \
    xvfb \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install base Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- AI Optimization Segment ---
# Force CPU-only installation of PyTorch to save >1GB of disk space 
# and prevent build memory spikes.
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir easyocr

# Copy all other files
COPY . .

# Run app with 1 worker to stay within the 512MB RAM limit of Render free tier
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:10000", "--timeout", "180", "--workers", "1"]
