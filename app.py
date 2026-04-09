from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import re
import time
import gc

# Log memory usage if psutil is available
try:
    import psutil
    def log_mem(tag):
        process = psutil.Process(os.getpid())
        mem = process.memory_info().rss / 1024 / 1024
        print(f"DEBUG MEM [{tag}]: {mem:.2f} MB")
except ImportError:
    def log_mem(tag):
        pass



app = Flask(__name__)
# Enable CORS for the Next.js frontend (default dev port 3000)
CORS(app, resources={r"/*": {"origins": "*"}})


app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
HISTORY_FILE = 'data/history.json'
USERS_FILE = 'data/users.json'
os.makedirs('data', exist_ok=True)

# ====== Storage Logic ======

def load_json(file_path):
    import json
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_json(file_path, data):
    import json
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)


def save_history(record):
    import datetime
    history = load_json(HISTORY_FILE)
    record['id'] = f"CERT-{len(history) + 1:03d}"
    record['date'] = datetime.datetime.now().strftime("%b %d, %Y")
    history.insert(0, record)
    save_json(HISTORY_FILE, history[:50])
    return record


# ====== Utility Functions ======

def extract_text_from_pdf(pdf_path):
    import PyPDF2
    try:
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            return "".join(page.extract_text() for page in reader.pages if page.extract_text())
    except Exception as e:
        return ""


def extract_images_from_pdf(pdf_path):
    import fitz
    import io
    from PIL import Image
    try:
        doc = fitz.open(pdf_path)
        images = []
        for page in doc:
            for img in page.get_images(full=True):
                base_image = doc.extract_image(img[0])
                image_bytes = base_image["image"]
                images.append(Image.open(io.BytesIO(image_bytes)))
        return images
    except:
        return []


def detect_qr_platform(pdf_path):
    from pyzbar.pyzbar import decode
    for image in extract_images_from_pdf(pdf_path):
        for obj in decode(image):
            qr_data = obj.data.decode("utf-8").strip()

            if qr_data.startswith("http"):
                return "alison"
            if "credentialSubject" in qr_data or "infosys" in qr_data.lower():
                return "infosys"
    return None


def is_image_based_pdf(pdf_path):
    return not extract_text_from_pdf(pdf_path) and bool(extract_images_from_pdf(pdf_path))

def detect_certification_platform(pdf_path):
    text = extract_text_from_pdf(pdf_path).lower()
    filename = pdf_path.split("/")[-1].split("\\")[-1].lower()
    
    # 1. Check for Coursera
    if any(k in text or k in filename for k in ["coursera", "google cloud", "university of"]):
        return "coursera"
    
    # 2. Check for Infosys
    if any(k in text or k in filename for k in ["infosys", "springboard", "knowledge institute"]):
        return "infosys"
    
    # 2. Check for Saylor
    saylor_keywords = ["saylor", "academy", "jeffery daubs", "verification code", "direct credit", "saylor.org"]
    if any(k in text or k in filename for k in saylor_keywords) or re.search(r"\b[A-Z0-9]{8,15}\b", text + filename):
        return "saylor"
    


    # 4. Check for Alison
    qr = detect_qr_platform(pdf_path)
    if qr == "alison" or "alison" in text or "alison" in filename:
        return "alison"
    
    # 5. Check for Udemy
    udemy_keywords = ["udemy", "certificate of completion", "instructor", "udemy certified", "has successfully completed the course", "a online course"]
    if any(k in text or k in filename for k in udemy_keywords) or "uc-" in text or "uc-" in filename:
        return "udemy"
    
    # 6. QR Fallback
    if qr:
        return qr
        
    # Final Resort Fallback
    if "coursera" in text: return "coursera"
    if "udemy" in text: return "udemy"
    return "saylor" if text else "udemy"

# ====== Parsing Logic ======

def parse_verification_output(output, platform, text, forensic_result=None):
    # Failure-First Rule: if there's a red X or specific error words, it's NOT valid
    output_lower = output.lower()
    
    # Check for forensic findings
    is_suspicious = False
    metadata_msg = ""
    if forensic_result:
        is_suspicious, metadata_msg = forensic_result

    # Remove metadata notes before checking for failure indicators to avoid false positives 
    # (e.g., "[Note: Minor mismatch...]" in a success message)
    clean_output = re.sub(r"\[Note:.*?\]", "", output, flags=re.DOTALL | re.IGNORECASE)
    clean_output_lower = clean_output.lower()
    
    # Check for failure indicators in the clean output
    has_error = "❌" in clean_output or "error" in clean_output_lower or "mismatch" in clean_output_lower or "fake" in clean_output_lower
    
    # Check for success indicators
    has_success = "✅" in output or "valid" in output_lower or "authentic" in output_lower or "verified" in output_lower
    
    # Check for analysis/manual check flags
    is_analysis = "analysis" in output_lower or "restricted" in output_lower or "manual" in output_lower
    
    # Final validity decision: MUST have success indicator and MUST NOT have error indicator
    is_valid = has_success and not has_error
    
    if is_analysis and not has_success:
        status = "manual_check"
    elif is_valid:
        status = "valid"
    else:
        status = "fake"
    
    # Status Adjustment: downgrade if forensic analysis is suspicious
    if status == "valid" and is_suspicious:
        status = "manual_check"

    # Precise extraction for standardized labels
    name_match = re.search(r"^(?:Verified )?Name:\s*(.+)$", output, re.MULTILINE | re.IGNORECASE)
    name = name_match.group(1).strip() if name_match else ""
    if not name:
        name_match = re.search(r"Name:\s+([A-Za-z\s]+?)(?=\n|$)", output)
        name = name_match.group(1).strip() if name_match else "Extracted from Certificate"
    
    course_match = re.search(r"^Course:\s*(.+)$", output, re.MULTILINE | re.IGNORECASE)
    course = course_match.group(1).strip() if course_match else "Extracted from Certificate"
    
    # NEW: Hours and Date extraction
    hours_match = re.search(r"^Hours:\s*(.+)$", output, re.MULTILINE | re.IGNORECASE)
    hours = hours_match.group(1).strip() if hours_match else "N/A"
    
    date_match = re.search(r"^Date:\s*(.+)$", output, re.MULTILINE | re.IGNORECASE)
    extracted_date = date_match.group(1).strip() if date_match else ""
    
    url_match = re.search(r"(https?://[^\s]+)", output)
    url = url_match.group(1).strip() if url_match else ""

    import datetime
    return {
        "isValid": is_valid,
        "name": name,
        "course": course,
        "platform": platform.capitalize(),
        "verificationUrl": url,
        "issueDate": extracted_date if extracted_date else datetime.datetime.now().strftime("%B %d, %Y"),
        "totalHours": hours,
        "certificateId": f"CERT-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')[-6:]}",
        "rawOutput": output,
        "status": status,
        "isSuspicious": is_suspicious,
        "metadataMessage": metadata_msg
    }


def execute_script(platform, pdf_path):
    max_retries = 3
    last_result = ""
    
    for attempt in range(max_retries):
        try:
            if platform == "coursera":
                import coursera
                result = coursera.run_verification(pdf_path)
            elif platform == "udemy":
                import udemy
                result = udemy.run_verification(pdf_path)
            elif platform == "alison":
                import alison
                result = alison.run_verification(pdf_path)
            elif platform == "saylor":
                import saylor
                result = saylor.run_verification(pdf_path)
            elif platform == "infosys":
                import infosys
                result = infosys.run_verification(pdf_path)
            else:
                return "❌ No matching script found for platform."

            # If the result is a success (✅), return immediately
            if "✅" in result:
                return result
            
            # If the result is a failure indicator, we retry if attempts are left
            # We retry for "❌", "fake", or "error" results
            is_failure = "❌" in result or "fake" in result.lower() or "error" in result.lower()
            
            if is_failure and attempt < max_retries - 1:
                print(f"DEBUG: Smart Manager - Attempt {attempt + 1} failed for {platform}. Retrying in 2s...")
                time.sleep(2)
                continue
            
            return result
                
        except Exception as e:
            last_result = f"❌ Error running verification for {platform}: {str(e)}"
            if attempt < max_retries - 1:
                print(f"DEBUG: Smart Manager - Exception on attempt {attempt + 1}: {str(e)}. Retrying...")
                time.sleep(2)
                continue
            return last_result
    
    return last_result

# ====== Routes ======

@app.route('/')
def home():
    return jsonify({"message": "TechStorm API is running", "endpoints": ["/verify", "/history", "/chat", "/register", "/login", "/session"]})

# ------ Auth Routes ------

@app.route('/register', methods=['POST'])
def register():
    import uuid
    import datetime
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([name, email, password]):
        return jsonify({"error": "Missing required fields"}), 400
        
    users = load_json(USERS_FILE)
    if any(u['email'] == email for u in users):
        return jsonify({"error": "Email already registered"}), 409
        
    hashed_password = generate_password_hash(password)
    user_id = str(uuid.uuid4())
    
    new_user = {
        "id": user_id,
        "name": name,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.datetime.now().isoformat()
    }

    
    users.append(new_user)
    save_json(USERS_FILE, users)
    
    # Return user data (without password)
    return jsonify({
        "id": user_id,
        "name": name,
        "email": email,
        "message": "User registered successfully"
    }), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    users = load_json(USERS_FILE)
    user = next((u for u in users if u['email'] == email), None)
    
    if user and check_password_hash(user['password'], password):
        return jsonify({
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "message": "Login successful"
        })
        
    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/session', methods=['POST'])
def session_check():
    data = request.json
    user_id = data.get('id')
    
    users = load_json(USERS_FILE)
    user = next((u for u in users if u['id'] == user_id), None)
    
    if user:
        return jsonify({
            "id": user['id'],
            "name": user['name'],
            "email": user['email']
        })
        
    return jsonify({"error": "Session invalid"}), 401

# ====== Forensic Logic ======

def check_pdf_metadata(file_path):
    """
    Analyzes PDF metadata to detect suspicious creation tools (Photoshop, Canva, etc.)
    """
    import PyPDF2
    try:
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            metadata = reader.metadata
            if not metadata:
                return False, "No forensic metadata available"
            
            suspicious_tools = ["photoshop", "illustrator", "canva", "gimp", "pdfeditor", "inkscape", "affinity"]
            creator = str(metadata.get('/Creator', '')).lower()
            producer = str(metadata.get('/Producer', '')).lower()
            
            found_tools = [tool for tool in suspicious_tools if tool in creator or tool in producer]
            if found_tools:
                return True, f"Possible tampering: Document metadata reveals use of {', '.join(found_tools)}"
            return False, ""
    except Exception as e:
        return False, f"Forensic check skipped: {str(e)}"


# ------ Verification Routes ------

@app.route('/verify', methods=['POST'])
def verify():
    # Force garbage collection at the start to ensure maximum RAM for the browser
    gc.collect()

    if 'certificate' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['certificate']
    if not file or not file.filename.endswith('.pdf'):
        return jsonify({"error": "Please upload a valid PDF"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # Get optional platform from form data (default to 'auto')
    selected_platform = request.form.get('platform', 'auto').lower()
    
    if selected_platform == 'auto' or not selected_platform:
        platform = detect_certification_platform(filepath)
    else:
        platform = selected_platform

    raw_output = execute_script(platform, filepath)
    forensic_result = check_pdf_metadata(filepath)
    
    text = extract_text_from_pdf(filepath) or ""
    result = parse_verification_output(raw_output, platform, text, forensic_result)
    
    save_history(result)
    
    # Explicit memory cleanup after processing
    gc.collect()
    
    return jsonify(result)


@app.route('/history', methods=['GET'])
def get_history():
    history = load_json(HISTORY_FILE)
    valid_count = sum(1 for r in history if r.get('isValid'))
    fake_count = len(history) - valid_count
    
    return jsonify({
        "verifications": history,
        "stats": {
            "total": len(history),
            "valid": valid_count,
            "fake": fake_count,
            "avgTime": "2.1s"
        }
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '').lower()
    
    if 'platform' in user_message or 'supported' in user_message:
        reply = "Currently, I support verification for Coursera, Udemy, Alison, Saylor Academy, and Infosys Springboard certificates."
    elif 'how' in user_message and 'work' in user_message:
        reply = "I use advanced AI to extract key details like the student name and certificate ID from your PDF, then I cross-reference them with the official platform's records using real-time validation!"
    elif 'fake' in user_message:
        reply = "I detect fake certificates by identifying mismatches between the extracted data and the platform's verification page. If they don't match, I flag it as potentially fraudulent."
    elif 'hello' in user_message or 'hi' in user_message:
        reply = "Hello! I'm CertiGuard AI. How can I help you with certificate verification today?"
    else:
        reply = "That's a great question about certificate verification! To help you better, could you tell me more about what you're looking for, or try uploading a certificate for me to check?"

    return jsonify({"reply": reply})

if __name__ == '__main__':
    # Startup check for Chromium binary
    linux_path = "/usr/bin/chromium"
    if os.path.exists(linux_path):
        print(f"STARTUP: Found system chromium at {linux_path}")
    else:
        print("STARTUP WARNING: System chromium not found at /usr/bin/chromium")
        
    app.run(host='0.0.0.0', port=10000)

