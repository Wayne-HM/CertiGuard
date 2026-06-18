"""
CertiGuard Worker Client
=========================
Communicates with the HuggingFace Spaces GPU worker for:
- PDF OCR + QR code extraction
- Remote image OCR (for Mindluster certificates)

Includes retry logic and exponential backoff for cold-start handling.
"""

import requests
import base64
import os
import time


class WorkerClient:
    def __init__(self, worker_url=None):
        self.worker_url = worker_url or os.environ.get("WORKER_URL")

    def is_available(self):
        if not self.worker_url:
            print("WARNING: WORKER_URL is NOT set. Remote processing DISABLED.")
            return False
        return True

    def _get_base_url(self):
        return self.worker_url.rstrip("/")

    def process_pdf(self, pdf_path):
        """
        Sends PDF to remote worker for OCR, QR, and image extraction.
        Returns a dict with extracted data or None if failed.
        Includes retry logic for HuggingFace cold-start (can take ~60s).
        """
        if not self.worker_url:
            return None

        try:
            with open(pdf_path, "rb") as f:
                pdf_base64 = base64.b64encode(f.read()).decode("utf-8")

            print(f"DEBUG: Offloading PDF to worker at {self.worker_url}")
            start_time = time.time()

            max_retries = 2
            for attempt in range(max_retries):
                try:
                    response = requests.post(
                        f"{self._get_base_url()}/process",
                        json={"pdf_base64": pdf_base64},
                        timeout=120,  # HF Space cold-start can take up to 120s
                    )

                    if response.status_code == 200:
                        print(f"DEBUG: Worker success in {time.time() - start_time:.2f}s")
                        return response.json()
                    elif response.status_code == 503:
                        # Space is waking up — wait and retry
                        if attempt < max_retries - 1:
                            wait = 15 * (attempt + 1)
                            print(f"DEBUG: Worker cold-starting, retrying in {wait}s...")
                            time.sleep(wait)
                            continue
                    else:
                        print(f"DEBUG: Worker failed HTTP {response.status_code}: {response.text[:200]}")
                        return None
                except requests.exceptions.Timeout:
                    if attempt < max_retries - 1:
                        print(f"DEBUG: Worker timeout, retrying...")
                        time.sleep(5)
                        continue
                    return None

        except Exception as e:
            print(f"DEBUG: Worker communication error: {e}")
            return None

    def ocr_image_url(self, image_url):
        """
        Send a remote image URL to the worker for OCR.
        Used for Mindluster certificate image verification.
        Returns OCR text string or None.
        """
        if not self.worker_url:
            return None

        try:
            print(f"DEBUG: Requesting image OCR from worker: {image_url[:60]}...")
            response = requests.post(
                f"{self._get_base_url()}/ocr_image_url",
                json={"image_url": image_url},
                timeout=60,
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "ok" and data.get("ocr_text"):
                    print(f"DEBUG: Image OCR returned {len(data['ocr_text'])} chars")
                    return data["ocr_text"]
                print(f"DEBUG: Image OCR status: {data.get('status')}")
                return None
            else:
                print(f"DEBUG: Image OCR failed HTTP {response.status_code}")
                return None
        except Exception as e:
            print(f"DEBUG: Image OCR error: {e}")
            return None

    def health_check(self):
        """Check if the worker is healthy and responding."""
        if not self.worker_url:
            return False
        try:
            response = requests.get(f"{self._get_base_url()}/health", timeout=10)
            return response.status_code == 200
        except Exception:
            return False


# Singleton instance
client = WorkerClient()
