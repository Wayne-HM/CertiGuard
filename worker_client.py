import requests
import base64
import os
import time

class WorkerClient:
    def __init__(self, worker_url=None):
        self.worker_url = worker_url or os.environ.get("WORKER_URL")

    def is_available(self):
        return bool(self.worker_url)

    def process_pdf(self, pdf_path):
        """
        Sends PDF to remote worker for OCR, QR, and image extraction.
        Returns a dict with extracted data or None if failed.
        """
        if not self.worker_url:
            return None

        try:
            with open(pdf_path, "rb") as f:
                pdf_base64 = base64.b64encode(f.read()).decode("utf-8")

            print(f"DEBUG: Offloading PDF to worker at {self.worker_url}")
            start_time = time.time()
            response = requests.post(
                f"{self.worker_url.rstrip('/')}/process",
                json={"pdf_base64": pdf_base64},
                timeout=55  # Worker has 60s max on Vercel
            )
            
            if response.status_code == 200:
                print(f"DEBUG: Worker success in {time.time() - start_time:.2f}s")
                return response.json()
            else:
                print(f"DEBUG: Worker failed with status {response.status_code}: {response.text}")
                return None
        except Exception as e:
            print(f"DEBUG: Worker communication error: {e}")
            return None

# Singleton instance
client = WorkerClient()
