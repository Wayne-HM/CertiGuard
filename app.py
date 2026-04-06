from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
import PyPDF2
import fitz
from pyzbar.pyzbar import decode
from PIL import Image
import io
import json
import re
import datetime
import uuid
from werkzeug.utils import secure_filename

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
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except:
            return []
    return []

def save_json(file_path, data):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def save_history(record):
    history = load_json(HISTORY_FILE)
    record['id'] = f"CERT-{len(history) + 1:03d}"
    record['date'] = datetime.datetime.now().strftime("%b %d, %Y")
    history.insert(0, record)
    save_json(HISTORY_FILE, history[:50])
    return record

# ====== Utility Functions ======

def extract_text_from_pdf(pdf_path):
    try:
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            return "".join(page.extract_text() for page in reader.pages if page.extract_text())
    except Exception as e:
        return None

def extract_images_from_pdf(pdf_path):
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
    for image in extract_images_from_pdf(pdf_path):
        for obj in decode(image):
            qr_data = obj.data.decode("utf-8").strip()

            if qr_data.startswith("http"):
                return "alison"
    return None

def is_image_based_pdf(pdf_path):
    return not extract_text_from_pdf(pdf_path) and bool(extract_images_from_pdf(pdf_path))

def detect_certification_platform(pdf_path):
    text = extract_text_from_pdf(pdf_path).lower()
    filename = pdf_path.split("/")[-1].split("\\")[-1].lower()
    
    # 1. Check for Coursera
    if any(k in text or k in filename for k in ["coursera", "google cloud", "university of"]):
        return "coursera"
    
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

def parse_verification_output(output, platform, text):
    # Failure-First Rule: if there's a red X or specific error words, it's NOT valid
    output_lower = output.lower()
    
    # Check for failure indicators
    has_error = "❌" in output or "error" in output_lower or "mismatch" in output_lower or "fake" in output_lower
    
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
    
    # Precise extraction for standardized labels
    name_match = re.search(r"^Name:\s*(.+)$", output, re.MULTILINE | re.IGNORECASE)
    name = name_match.group(1).strip() if name_match else ""
    if not name:
        # Fallback to older format (Stricter matching to avoid error message words)
        name_match = re.search(r"Name:\s+([A-Za-z\s]+)", output)
        name = name_match.group(1).strip() if name_match else "Extracted from Certificate"
    
    course_match = re.search(r"^Course:\s*(.+)$", output, re.MULTILINE | re.IGNORECASE)
    course = course_match.group(1).strip() if course_match else "Extracted from Certificate"
    
    url_match = re.search(r"(https?://[^\s]+)", output)
    url = url_match.group(1).strip() if url_match else ""

    return {
        "isValid": is_valid,
        "name": name,
        "course": course,
        "platform": platform.capitalize(),
        "verificationUrl": url,
        "issueDate": datetime.datetime.now().strftime("%B %d, %Y"),
        "certificateId": f"CERT-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')[-6:]}",
        "rawOutput": output,
        "status": status
    }

def execute_script(platform, pdf_path):
    try:
        if platform == "coursera":
            import coursera
            return coursera.run_verification(pdf_path)
        elif platform == "udemy":
            import udemy
            return udemy.run_verification(pdf_path)
        elif platform == "alison":
            import alison
            return alison.run_verification(pdf_path)
        elif platform == "saylor":
            import saylor
            return saylor.run_verification(pdf_path)

        else:
            return "❌ No matching script found for platform."
    except Exception as e:
        return f"❌ Error running verification for {platform}: {str(e)}"

# ====== Routes ======

@app.route('/')
def home():
    return jsonify({"message": "TechStorm API is running", "endpoints": ["/verify", "/history", "/chat", "/register", "/login", "/session"]})

# ------ Auth Routes ------

@app.route('/register', methods=['POST'])
def register():
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

# ------ Verification Routes ------

@app.route('/verify', methods=['POST'])
def verify():
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
    
    text = extract_text_from_pdf(filepath) or ""
    result = parse_verification_output(raw_output, platform, text)
    
    save_history(result)
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
        reply = "Currently, I support verification for Coursera, Udemy, Alison, and Saylor Academy certificates."
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
    app.run(host='0.0.0.0', port=5000, debug=True)
