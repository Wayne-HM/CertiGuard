from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import re
import time
import gc
import json as json_mod
import worker_client
from concurrent.futures import ThreadPoolExecutor, as_completed

# Log memory usage if psutil is available
try:
    import psutil
    def log_mem(tag):
        process = psutil.Process(os.getpid())
        mem = process.memory_info().rss / 1024 / 1024
        print(f"DEBUG MEM [{tag}]: {mem:.2f} MB")
except ImportError:
    def log_mem(tag):
        import gc
        gc.collect()
        print(f"DEBUG MEM [{tag}]: GC executed (psutil missing)")



def format_date(date_str):
    """Universal date polisher: handles ISO, ordinal, and standard formats."""
    if not date_str or date_str == "N/A": return "N/A"
    try:
        from datetime import datetime
        # Convert to string and strip ordinal suffixes: 10th -> 10, 1st -> 1
        d_clean = str(date_str)
        d_clean = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', d_clean, flags=re.I)

        # Handle ISO format: 2026-04-01T...
        if 'T' in d_clean:
            iso_clean = d_clean.split('T')[0]
            dt = datetime.strptime(iso_clean, '%Y-%m-%d')
            return dt.strftime('%B %d, %Y')
            
        # Handle 2026-04-01
        if re.match(r'^\d{4}-\d{2}-\d{2}$', d_clean):
            dt = datetime.strptime(d_clean, '%Y-%m-%d')
            return dt.strftime('%B %d, %Y')
            
        # Handle "10 April 2020" or "April 10 2020"
        for fmt in ('%d %B %Y', '%B %d %Y', '%d %b %Y', '%b %d %Y'):
            try:
                # Remove commas for easier parsing
                dt = datetime.strptime(d_clean.replace(',', ''), fmt)
                return dt.strftime('%B %d, %Y')
            except ValueError:
                continue
                
        return date_str
    except:
        return date_str

app = Flask(__name__)
# Enable CORS for both local development and the production Vercel frontend
CORS(app, resources={r"/*": {
    "origins": ["*", "https://certiguardofficial.vercel.app"],
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})


app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
HISTORY_FILE = 'data/history.json'
USERS_FILE = 'data/users.json'
os.makedirs('data', exist_ok=True)

# ====== Encrypted Master Cache ======
try:
    from sqlalchemy import create_engine, Column, String, Text, Float
    from sqlalchemy.orm import declarative_base, sessionmaker
    from cryptography.fernet import Fernet

    db_engine = create_engine('sqlite:///data/masterCache.db', echo=False)
    BaseModel = declarative_base()
    encryption_key = os.environ.get('CACHE_ENCRYPTION_KEY', Fernet.generate_key().decode())
    cipher_suite = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)

    class MasterCache(BaseModel):
        __tablename__ = 'master_cache'
        cache_key = Column(String, primary_key=True)
        platform = Column(String)
        official_data = Column(Text)
        cached_at = Column(Float)  # timestamp

    BaseModel.metadata.create_all(db_engine)
    SessionMaker = sessionmaker(bind=db_engine)
    CACHE_ENABLED = True
    CACHE_TTL = 7 * 24 * 3600  # 7 days
    print("STARTUP: Encrypted Master Cache initialized")

    def get_cached_data(cache_key):
        session = SessionMaker()
        try:
            record = session.query(MasterCache).filter_by(cache_key=cache_key).first()
            if record:
                # Check TTL
                if time.time() - (record.cached_at or 0) > CACHE_TTL:
                    session.delete(record)
                    session.commit()
                    return None
                decrypted = cipher_suite.decrypt(record.official_data.encode()).decode()
                print(f"[CACHE HIT] {cache_key}")
                return json_mod.loads(decrypted)
        except Exception as e:
            print(f"[CACHE ERROR] {e}")
        finally:
            session.close()
        return None

    def save_to_cache(cache_key, platform, data):
        if not data or data.get('status') != 'Authentic':
            return
        session = SessionMaker()
        try:
            encrypted = cipher_suite.encrypt(json_mod.dumps(data).encode()).decode()
            existing = session.query(MasterCache).filter_by(cache_key=cache_key).first()
            if existing:
                existing.official_data = encrypted
                existing.cached_at = time.time()
            else:
                session.add(MasterCache(
                    cache_key=cache_key, platform=platform,
                    official_data=encrypted, cached_at=time.time()
                ))
            session.commit()
            print(f"[CACHE SAVE] {platform} data for {cache_key}")
        except Exception as e:
            print(f"[CACHE SAVE ERROR] {e}")
        finally:
            session.close()

except ImportError as e:
    print(f"STARTUP: Cache dependencies missing ({e}), cache disabled")
    CACHE_ENABLED = False
    def get_cached_data(k): return None
    def save_to_cache(k, p, d): pass

MAX_BATCH_SIZE = 25

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


def save_history(record, user_id=None):
    import datetime
    history = load_json(HISTORY_FILE)
    record['id'] = f"CERT-{len(history) + 1:03d}"
    record['date'] = datetime.datetime.now().strftime("%b %d, %Y")
    record['user_id'] = user_id
    history.insert(0, record)
    # Increased global history limit to 500 to accommodate multiple users
    save_json(HISTORY_FILE, history[:500])
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


def extract_links_from_pdf(pdf_path):
    """Extract embedded hyperlinks (URL annotations) from a PDF."""
    import PyPDF2
    links = []
    try:
        with open(pdf_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                if '/Annots' in page:
                    for annot in page['/Annots']:
                        obj = annot.get_object()
                        if isinstance(obj, dict) and '/A' in obj and '/URI' in obj['/A']:
                            links.append(obj['/A']['/URI'])
    except Exception as e:
        print(f"DEBUG: Link extraction error: {e}")
    return links


def extract_images_from_pdf(pdf_path):
    # LOCAL IMAGE EXTRACTION DISABLED: Use Worker
    return []


def detect_qr_platform(pdf_path, worker_data=None):
    # If worker already found QR codes, use them! (Zero local memory cost)
    if worker_data and worker_data.get("qr_codes"):
        for qr_data in worker_data["qr_codes"]:
            if qr_data.startswith("http") and "alison" in qr_data:
                return "alison"
            if "credentialSubject" in qr_data or "infosys" in qr_data.lower():
                return "infosys"

    # Local scan disabled to prevent crashes
    return None


def detect_certification_platform(pdf_path, worker_data=None):
    # 0. Check worker text first (zero cost)
    text = ""
    if worker_data and worker_data.get("text"):
        text = worker_data["text"].lower()
    else:
        text = extract_text_from_pdf(pdf_path).lower()

    filename = pdf_path.split("/")[-1].split("\\")[-1].lower()

    # 0b. Extract embedded PDF links for platforms whose branding is image-only
    pdf_links = extract_links_from_pdf(pdf_path)
    links_text = " ".join(pdf_links).lower()
    
    # 1. Check for Coursera
    if any(k in text or k in filename for k in ["coursera", "google cloud", "university of"]):
        return "coursera"
    
    # 2. Check for Saylor (BEFORE Udemy — Saylor certs contain generic phrases)
    saylor_keywords = ["saylor", "jeffery daubs", "saylor.org", "learn.saylor.org", "saylor academy"]
    if any(k in text or k in filename or k in links_text for k in saylor_keywords):
        return "saylor"
    
    # 3. Check for Alison
    if "alison" in text or "alison" in filename:
        return "alison"

    # 4. Check for AWS Academy / Credly
    aws_keywords = ["aws academy", "aws certified", "credly.com"]
    if any(k in text or k in filename or k in links_text for k in aws_keywords):
        return "aws"

    # 5. Check for Cisco Networking Academy
    cisco_keywords = ["cisco", "networking academy", "netacad", "ccna", "ccnp", "cyberops"]
    if any(k in text or k in filename or k in links_text for k in cisco_keywords):
        return "cisco"

    # 6. Check for Mindluster
    if "mindluster" in text or "mindluster" in filename or "mindluster" in links_text:
        return "mindluster"
    
    # 7. Check for Infosys (QR-Only as per requirement)
    # Identification handled via detect_qr_platform below

    # 8. Check for Udemy (platform-specific markers only)
    udemy_keywords = ["udemy", "udemy certified", "ude.my"]
    if any(k in text or k in filename for k in udemy_keywords) or "uc-" in text or "uc-" in filename:
        return "udemy"
    
    # 9. QR Fallback — use worker_data preferred
    qr = detect_qr_platform(pdf_path, worker_data=worker_data)
    if qr:
        return qr
        
    return "udemy"

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
    
    # Check for analysis/manual check/action required flags
    is_analysis = "analysis" in output_lower or "restricted" in output_lower or "manual" in output_lower
    is_action_required = "⚠️" in output or "action required" in output_lower or "verification required" in output_lower
    
    # Final validity decision: MUST have success indicator and MUST NOT have error indicator
    is_valid = has_success and not has_error
    
    if is_action_required:
        status = "action_required"
    elif is_analysis and not has_success:
        status = "manual_check"
    elif is_valid:
        status = "valid"
    else:
        status = "fake"
    
    # Status Adjustment: downgrade if forensic analysis is suspicious
    if status == "valid" and is_suspicious:
        status = "manual_check"

    # Precise extraction for standardized labels
    # 1. Name Extraction
    name_match = re.search(r"^(?:Verified )?Name:\s*(.+)$", output, re.MULTILINE | re.IGNORECASE)
    name = name_match.group(1).strip() if name_match else ""
    if not name or name == "Name Not Found":
        name_match = re.search(r"(?:name|student):\s+([A-Za-z\s]+?)(?=\n|$)", output, re.IGNORECASE)
        name = name_match.group(1).strip() if name_match else "Extracted from Certificate"
    
    # 2. Course Extraction - Greedier capture (allows multi-line, stops at specific labels or end of string)
    course_match = re.search(r"^Course:\s*(.*?)(?=\n[A-Z][a-z]+:|\nURL:|\Z)", output, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    course = course_match.group(1).strip() if course_match else ""
    if not course or course == "Course Not Found" or len(course) < 5:
        course_match = re.search(r"course:\s*(.+?)(?=\n[A-Z][a-z]+:|\nURL:|\Z)", output, re.IGNORECASE | re.DOTALL)
        course = course_match.group(1).strip() if course_match else "Extracted from Certificate"
    
    # 3. Hours and Date
    hours_match = re.search(r"^Hours:\s*(.+)$", output, re.MULTILINE | re.IGNORECASE)
    hours = hours_match.group(1).strip() if hours_match else "N/A"
    
    date_match = re.search(r"^Date:\s*(.+)$", output, re.MULTILINE | re.IGNORECASE)
    extracted_date = date_match.group(1).strip() if date_match else ""
    
    url_match = re.search(r"(https?://[^\s]+)", output)
    url = url_match.group(1).strip() if url_match else ""

    return {
        "isValid": is_valid,
        "name": name,
        "course": course,
        "platform": platform.capitalize(),
        "verificationUrl": url,
        "issueDate": format_date(extracted_date) if extracted_date else "N/A",
        "totalHours": hours,
        "certificateId": f"CERT-{os.urandom(3).hex().upper()}",
        "rawOutput": output,
        "status": status,
        "isSuspicious": is_suspicious,
        "metadataMessage": metadata_msg
    }


def execute_script(platform, pdf_path, worker_data=None):
    max_retries = 1
    last_result = ""
    
    for attempt in range(max_retries):
        try:
            if platform == "coursera":
                import coursera
                result = coursera.run_verification(pdf_path)
            elif platform == "udemy":
                import udemy
                result = udemy.run_verification(pdf_path, worker_data=worker_data)
            elif platform == "alison":
                import alison
                result = alison.run_verification(pdf_path, worker_data=worker_data)
            elif platform == "saylor":
                import saylor
                result = saylor.run_verification(pdf_path, worker_data=worker_data)
            elif platform == "infosys":
                import infosys
                result = infosys.run_verification(pdf_path, worker_data=worker_data)
            elif platform == "aws":
                import aws
                result = aws.run_verification(pdf_path, worker_data=worker_data)
            elif platform == "cisco":
                import cisco
                result = cisco.run_verification(pdf_path, worker_data=worker_data)
            elif platform == "mindluster":
                import mindluster
                result = mindluster.run_verification(pdf_path, worker_data=worker_data)
            else:
                return "❌ No matching script found for platform."

            # If the result is a success (✅), return immediately
            if "✅" in result:
                return result
            
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
    return jsonify({"message": "TechStorm API is running", "version": "3.0-noBrowser", "endpoints": ["/verify", "/history", "/chat", "/register", "/login", "/session"]})

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
            
            suspicious_tools = ["photoshop", "illustrator", "canva", "gimp", "pdfeditor", "inkscape", "affinity", "ilovepdf", "sejda", "pdfescape", "foxit phantom", "coreldraw", "pdf24", "nitro"]
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
    filepath = None
    try:
        # Force garbage collection at the start
        gc.collect()

        if 'certificate' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['certificate']
        if not file or not file.filename:
            return jsonify({"error": "No file selected"}), 400
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files are supported. Image processing is disabled."}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # --- 1. Worker Offloading (Do this FIRST to avoid local memory usage) ---
        worker_data = None
        if worker_client.client.is_available():
            try:
                worker_data = worker_client.client.process_pdf(filepath)
                print(f"DEBUG: Worker data retrieved successfully")
            except Exception as e:
                print(f"DEBUG: Worker call failed: {e}")

        # --- 2. Platform Detection (Use worker data if available) ---
        selected_platform = request.form.get('platform', 'auto').lower()
        
        if selected_platform == 'auto' or not selected_platform:
            # We can now pass worker_data to the detector to avoid local QR scans
            platform = detect_certification_platform(filepath, worker_data=worker_data)
        else:
            platform = selected_platform

        print(f"DEBUG: Verifying {filename} as platform={platform}")

        raw_output = execute_script(platform, filepath, worker_data=worker_data)
        forensic_result = check_pdf_metadata(filepath)
        
        # Use worker text if available to avoid local extraction
        text = ""
        if worker_data and worker_data.get("text"):
            text = worker_data["text"]
        else:
            text = extract_text_from_pdf(filepath) or ""
            
        result = parse_verification_output(raw_output, platform, text, forensic_result)
        
        # Associate record with the user who uploaded it
        user_id = request.form.get('user_id') or request.headers.get('X-User-ID')
        save_history(result, user_id=user_id)
        
        log_mem("Before Response")
        return jsonify(result)

    except Exception as e:
        log_mem("On Error")
        print(f"CRITICAL ERROR in /verify: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Server error: {str(e)}",
            "isValid": False,
            "status": "error",
            "name": "Upload Failed",
            "course": "Server Error",
            "platform": "Error",
            "totalHours": "N/A"
        }), 500
    finally:
        # Always clean up
        if filepath and os.path.exists(filepath):
            try:
                os.remove(filepath)
            except:
                pass
        
        # Explicitly delete big objects
        if 'worker_data' in locals(): del worker_data
        if 'raw_output' in locals(): del raw_output
        if 'text' in locals(): del text
        
        gc.collect()
        log_mem("After Final Cleanup")



@app.route('/history', methods=['GET'])
def get_history():
    user_id = request.args.get('id')
    history = load_json(HISTORY_FILE)
    
    # Global stats always include everything (for everyone to see CertiGuard impact)
    total_global = len(history)
    valid_global = sum(1 for r in history if r.get('isValid'))
    fake_global = total_global - valid_global
    
    # User-specific history: only show records belonging to the user
    # Also ignore legacy records without user_id as requested
    user_history = [r for r in history if r.get('user_id') == user_id and user_id is not None]
    
    # If it's a guest or requested, we return the user-specific history and global stats
    return jsonify({
        "verifications": user_history,
        "stats": {
            "total": total_global,
            "valid": valid_global,
            "fake": fake_global,
            "avgTime": "2.1s"
        }
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '').lower()
    
    if 'platform' in user_message or 'supported' in user_message:
        reply = "I support verification for Coursera, Udemy, Alison, Saylor Academy, Infosys Springboard, AWS Academy (Credly), Cisco Networking Academy, and Mindluster certificates. You can also batch-verify up to 25 certificates at once!"
    elif 'batch' in user_message:
        reply = "Yes! You can upload up to 25 certificates at once using our batch verification feature. Each certificate is processed concurrently for maximum speed."
    elif 'how' in user_message and 'work' in user_message:
        reply = "I use a GPU-powered OCR engine on HuggingFace to extract text and QR codes, then cross-reference with official platform records. I also use fuzzy matching to handle OCR imperfections!"
    elif 'fake' in user_message:
        reply = "I detect fake certificates by identifying mismatches between the extracted data and the platform's verification page. I also check PDF metadata for signs of tampering with tools like Photoshop or Canva."
    elif 'hello' in user_message or 'hi' in user_message:
        reply = "Hello! I'm CertiGuard AI. How can I help you with certificate verification today?"
    else:
        reply = "That's a great question about certificate verification! To help you better, could you tell me more about what you're looking for, or try uploading a certificate for me to check?"

    return jsonify({"reply": reply})

# ====== Batch Verification ======

def _verify_single_for_batch(file_storage, platform_hint, user_id):
    """Process a single certificate for the batch endpoint. Runs in a thread."""
    filepath = None
    try:
        filename = secure_filename(file_storage.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"batch_{os.urandom(4).hex()}_{filename}")
        file_storage.save(filepath)

        worker_data = None
        if worker_client.client.is_available():
            try:
                worker_data = worker_client.client.process_pdf(filepath)
            except Exception:
                pass

        if platform_hint == 'auto' or not platform_hint:
            platform = detect_certification_platform(filepath, worker_data=worker_data)
        else:
            platform = platform_hint

        raw_output = execute_script(platform, filepath, worker_data=worker_data)
        forensic_result = check_pdf_metadata(filepath)

        text = ""
        if worker_data and worker_data.get("text"):
            text = worker_data["text"]
        else:
            text = extract_text_from_pdf(filepath) or ""

        result = parse_verification_output(raw_output, platform, text, forensic_result)
        result['filename'] = filename
        save_history(result, user_id=user_id)
        return result

    except Exception as e:
        return {
            "error": str(e), "isValid": False, "status": "error",
            "filename": getattr(file_storage, 'filename', 'unknown'),
            "name": "Error", "course": str(e), "platform": "Error", "totalHours": "N/A"
        }
    finally:
        if filepath and os.path.exists(filepath):
            try: os.remove(filepath)
            except: pass
        gc.collect()


@app.route('/verify-batch', methods=['POST'])
def verify_batch():
    """Batch verification: process up to 25 certificates concurrently."""
    try:
        files = []
        for key in request.files:
            f = request.files[key]
            if f and f.filename and f.filename.lower().endswith('.pdf'):
                files.append(f)

        if not files:
            return jsonify({"error": "No valid PDF files found"}), 400

        if len(files) > MAX_BATCH_SIZE:
            return jsonify({"error": f"Maximum {MAX_BATCH_SIZE} files per batch"}), 400

        platform_hint = request.form.get('platform', 'auto').lower()
        user_id = request.form.get('user_id') or request.headers.get('X-User-ID')

        print(f"DEBUG: Batch verification starting for {len(files)} files")
        results = []

        # Process concurrently with ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=min(len(files), 4)) as executor:
            futures = {
                executor.submit(_verify_single_for_batch, f, platform_hint, user_id): i
                for i, f in enumerate(files)
            }
            for future in as_completed(futures):
                idx = futures[future]
                try:
                    result = future.result(timeout=180)
                    results.append(result)
                except Exception as e:
                    results.append({
                        "error": str(e), "isValid": False, "status": "error",
                        "filename": f"file_{idx}", "name": "Error", "course": str(e),
                        "platform": "Error", "totalHours": "N/A"
                    })

        # Sort results to match upload order where possible
        total = len(results)
        valid = sum(1 for r in results if r.get('isValid'))

        return jsonify({
            "results": results,
            "summary": {
                "total": total,
                "valid": valid,
                "fake": total - valid
            }
        })

    except Exception as e:
        print(f"CRITICAL ERROR in /verify-batch: {str(e)}")
        return jsonify({"error": f"Batch error: {str(e)}"}), 500
    finally:
        gc.collect()


if __name__ == '__main__':
    print("STARTUP: CertiGuard API v4.0 (HuggingFace + Batch + 8 Platforms)")
    app.run(host='0.0.0.0', port=10000)
