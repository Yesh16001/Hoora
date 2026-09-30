import json
import base64
import time
import os
import uuid
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from database import get_db, init_db, log_audit
from matcher import find_potential_matches
from ai_service import ai_auto_tag_item, ai_verify_claim_evidence, set_gemini_api_key, get_gemini_api_key

app = Flask(__name__)
CORS(app)
SECRET_KEY = "campusfind-hackathon-super-secret-key"

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure DB is initialized on startup
init_db()

# Simple persistent Token Helpers
def generate_token(user_id, role):
    payload = {
        "user_id": user_id,
        "role": role,
        "created_at": time.time()
    }
    raw = json.dumps(payload)
    return base64.b64encode(raw.encode('utf-8')).decode('utf-8')

def decode_token(token_str):
    try:
        raw = base64.b64decode(token_str.encode('utf-8')).decode('utf-8')
        return json.loads(raw)
    except Exception:
        return None

def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    payload = decode_token(token)
    if not payload:
        return None
    
    conn = get_db()
    user = conn.execute("SELECT id, name, email, role, created_at FROM users WHERE id = ?", (payload['user_id'],)).fetchone()
    conn.close()
    if user:
        return dict(user)
    return None

def require_auth(role=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"success": False, "message": "Authentication required"}), 401
            if role and user['role'] != role:
                return jsonify({"success": False, "message": f"Forbidden: {role.upper()} access required"}), 403
            request.user = user
            return f(*args, **kwargs)
        return wrapper
    return decorator


def mask_sensitive_item(item, current_user):
    """
    Masks confidential details for high-value FOUND items (e.g., Gold Chain, Cash)
    so public users cannot see exact details and forge claims.
    Only Admin and the Reporter can view unmasked details.
    """
    item_dict = dict(item)
    is_admin = current_user and current_user.get('role') == 'admin'
    is_reporter = current_user and current_user.get('id') == item_dict.get('reported_by')
    
    if item_dict.get('item_type') == 'FOUND' and item_dict.get('is_valuable') == 1:
        if not is_admin and not is_reporter:
            item_dict['is_masked'] = True
            item_dict['title'] = f"🔒 Found High-Value Item ({item_dict.get('category')})"
            item_dict['description'] = "[CONFIDENTIAL SECURITY NOTICE]: This is a high-value item (jewelry/cash/precious item) secured by Campus Administration. Full details and photos are redacted publicly to prevent fraudulent claims. Please click 'Claim Item' below to submit your proof of ownership to Admin."
            item_dict['contact_info'] = "Secured at Admin Recovery Locker"
            item_dict['image_url'] = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&q=80"
        else:
            item_dict['is_masked'] = False
    else:
        item_dict['is_masked'] = False
        
    return item_dict


# ==================== AUTH ROUTES ====================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    role = data.get('role') or 'student'
    
    if len(name) < 2:
        return jsonify({"success": False, "message": "Full name must be at least 2 characters long"}), 400
        
    if not email or '@' not in email:
        return jsonify({"success": False, "message": "Please enter a valid campus email address"}), 400
        
    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters long"}), 400
        
    if role not in ['student', 'admin']:
        role = 'student'

    conn = get_db()
    cursor = conn.cursor()
    
    existing = cursor.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"success": False, "message": "An account with this email already exists"}), 400
        
    pw_hash = generate_password_hash(password)
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        (name, email, pw_hash, role)
    )
    conn.commit()
    user_id = cursor.lastrowid
    
    log_audit(cursor, None, name, role, "USER_REGISTERED", f"New account registered: {email}")
    conn.commit()
    conn.close()
    
    token = generate_token(user_id, role)
    user_data = {"id": user_id, "name": name, "email": email, "role": role}
    
    return jsonify({
        "success": True,
        "message": "Registration successful",
        "token": token,
        "user": user_data
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400
        
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    
    if not user or not check_password_hash(user['password_hash'], password):
        conn.close()
        return jsonify({"success": False, "message": "Invalid email or password"}), 401
        
    token = generate_token(user['id'], user['role'])
    user_data = {"id": user['id'], "name": user['name'], "email": user['email'], "role": user['role']}
    
    log_audit(conn, None, user['name'], user['role'], "USER_LOGIN", f"Authenticated via email: {email}")
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": user_data
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@require_auth()
def auth_me():
    return jsonify({
        "success": True,
        "user": request.user
    })


# ==================== FILE UPLOAD ROUTE ====================

@app.route('/api/upload', methods=['POST'])
@require_auth()
def upload_file():
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "message": "No file selected"}), 400
        
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf']:
            return jsonify({"success": False, "message": "Unsupported file format. Please upload JPG, PNG, WEBP or PDF."}), 400

        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        file_url = f"http://localhost:5000/uploads/{filename}"
        return jsonify({"success": True, "url": file_url})

    data = request.get_json() or {}
    image_data = data.get('image_data')
    if image_data:
        try:
            header, encoded = image_data.split(",", 1)
            ext = ".png"
            if "jpeg" in header or "jpg" in header: ext = ".jpg"
            elif "webp" in header: ext = ".webp"
            
            filename = f"{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            with open(filepath, "wb") as f:
                f.write(base64.b64decode(encoded))
                
            file_url = f"http://localhost:5000/uploads/{filename}"
            return jsonify({"success": True, "url": file_url})
        except Exception as e:
            return jsonify({"success": False, "message": f"Base64 image upload failed: {str(e)}"}), 400
            
    return jsonify({"success": False, "message": "No file or image_data provided"}), 400

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ==================== AI ASSISTANT & CONFIG ROUTES ====================

@app.route('/api/admin/config-ai', methods=['POST'])
@require_auth(role='admin')
def config_ai():
    data = request.get_json() or {}
    gemini_key = (data.get('gemini_api_key') or '').strip()
    set_gemini_api_key(gemini_key)
    return jsonify({
        "success": True, 
        "message": "Gemini API key updated successfully! Live AI analysis enabled." if gemini_key else "Gemini API key cleared. Using offline Smart AI Engine."
    })

@app.route('/api/ai/auto-tag', methods=['POST'])
@require_auth()
def ai_auto_tag():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    
    if not title and not description:
        return jsonify({"success": False, "message": "Title or description required for AI tagging"}), 400
        
    result = ai_auto_tag_item(title, description)
    return jsonify({"success": True, "data": result})

@app.route('/api/ai/verify-claim', methods=['POST'])
@require_auth(role='admin')
def ai_verify_claim():
    data = request.get_json() or {}
    item_title = data.get('item_title', '')
    item_description = data.get('item_description', '')
    claim_evidence = data.get('claim_evidence', '')
    
    if not claim_evidence:
        return jsonify({"success": False, "message": "Claim evidence required for AI analysis"}), 400
        
    result = ai_verify_claim_evidence(item_title, item_description, claim_evidence)
    return jsonify({"success": True, "analysis": result})


# ==================== ITEM ROUTES ====================

@app.route('/api/items', methods=['GET'])
def get_items():
    search = request.args.get('search', '').strip()
    item_type = request.args.get('type', '').strip().upper()
    category = request.args.get('category', '').strip()
    location = request.args.get('location', '').strip()
    status = request.args.get('status', '').strip().upper()
    my_items = request.args.get('my_items', '').lower() == 'true'
    
    current_user = get_current_user()
    is_admin = current_user and current_user.get('role') == 'admin'
    
    conn = get_db()
    query = """
        SELECT i.*, u.name as reporter_name, u.email as reporter_email 
        FROM items i
        JOIN users u ON i.reported_by = u.id
        WHERE 1=1
    """
    params = []
    
    if my_items:
        if not current_user:
            conn.close()
            return jsonify({"success": False, "message": "Auth required for my_items"}), 401
        query += " AND i.reported_by = ?"
        params.append(current_user['id'])
    elif is_admin:
        if status:
            query += " AND i.status = ?"
            params.append(status)
    else:
        query += " AND i.status IN ('APPROVED', 'MATCHED', 'CLAIMED', 'RETURNED') AND i.is_valuable = 0"
        
    if search:
        query += " AND (i.title LIKE ? OR i.description LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
        
    if item_type in ['LOST', 'FOUND']:
        query += " AND i.item_type = ?"
        params.append(item_type)
        
    if category:
        query += " AND i.category = ?"
        params.append(category)
        
    if location:
        query += " AND i.location = ?"
        params.append(location)
        
    query += " ORDER BY i.created_at DESC"
    
    rows = conn.execute(query, params).fetchall()
    conn.close()
    
    items = [mask_sensitive_item(dict(row), current_user) for row in rows]
    return jsonify({"success": True, "items": items, "count": len(items)})

@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item_detail(item_id):
    current_user = get_current_user()
    conn = get_db()
    row = conn.execute("""
        SELECT i.*, u.name as reporter_name, u.email as reporter_email 
        FROM items i
        JOIN users u ON i.reported_by = u.id
        WHERE i.id = ?
    """, (item_id,)).fetchone()
    conn.close()
    
    if not row:
        return jsonify({"success": False, "message": "Item not found"}), 404
        
    item_dict = mask_sensitive_item(dict(row), current_user)
    return jsonify({"success": True, "item": item_dict})

@app.route('/api/items', methods=['POST'])
@require_auth()
def create_item():
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    category = (data.get('category') or '').strip()
    item_type = (data.get('item_type') or '').strip().upper()
    location = (data.get('location') or '').strip()
    item_date = (data.get('item_date') or '').strip()
    contact_info = (data.get('contact_info') or '').strip()
    image_url = (data.get('image_url') or '').strip()
    
    if len(title) < 3:
        return jsonify({"success": False, "message": "Item title must be at least 3 characters long"}), 400
        
    if len(description) < 10:
        return jsonify({"success": False, "message": "Please provide a detailed description (at least 10 characters)"}), 400
        
    if not category or not item_type or not location or not item_date:
        return jsonify({"success": False, "message": "Category, item type, location, and date are required"}), 400
        
    try:
        req_date = datetime.strptime(item_date, '%Y-%m-%d')
        if req_date.date() > datetime.now().date():
            return jsonify({"success": False, "message": "Date cannot be in the future"}), 400
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format. Use YYYY-MM-DD"}), 400

    if item_type not in ['LOST', 'FOUND']:
        return jsonify({"success": False, "message": "Item type must be LOST or FOUND"}), 400

    is_valuable = 1 if data.get('is_valuable') or any(kw in f"{title} {description}".lower() for kw in ['gold', 'diamond', 'cash', 'jewelry', 'chain', 'rolex', 'emerald']) else 0

    initial_status = 'APPROVED' if request.user['role'] == 'admin' else 'PENDING'
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO items 
        (title, description, category, item_type, location, item_date, contact_info, status, reported_by, image_url, is_valuable)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (title, description, category, item_type, location, item_date, contact_info, initial_status, request.user['id'], image_url, is_valuable))
    
    new_id = cursor.lastrowid
    
    log_audit(cursor, new_id, request.user['name'], request.user['role'], "ITEM_REPORTED", f"Created {item_type} report: '{title}' in {location} (Status: {initial_status})")
    conn.commit()
    conn.close()
    
    msg = "Report submitted successfully! "
    if is_valuable:
        msg += "🔒 Flagged as High-Value Asset (secured with confidential protection)."
    else:
        msg += "It is now active." if initial_status == 'APPROVED' else "Awaiting admin review."
    
    return jsonify({
        "success": True,
        "message": msg,
        "item_id": new_id,
        "status": initial_status,
        "is_valuable": is_valuable
    }), 201


# ==================== SMART MATCHING ROUTE ====================

@app.route('/api/items/<int:item_id>/matches', methods=['GET'])
@require_auth()
def get_item_matches(item_id):
    current_user = request.user
    conn = get_db()
    target_row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not target_row:
        conn.close()
        return jsonify({"success": False, "message": "Target item not found"}), 404
        
    target_item = dict(target_row)
    opposite_type = 'FOUND' if target_item['item_type'] == 'LOST' else 'LOST'
    
    candidate_rows = conn.execute("""
        SELECT i.*, u.name as reporter_name, u.email as reporter_email 
        FROM items i
        JOIN users u ON i.reported_by = u.id
        WHERE i.item_type = ? AND i.status IN ('APPROVED', 'MATCHED', 'PENDING')
    """, (opposite_type,)).fetchall()
    conn.close()
    
    candidates = [dict(c) for c in candidate_rows]
    matches = find_potential_matches(target_item, candidates, min_threshold=45)
    
    for m in matches:
        m['item'] = mask_sensitive_item(m['item'], current_user)
        
    return jsonify({
        "success": True,
        "target_item": mask_sensitive_item(target_item, current_user),
        "matches": matches,
        "count": len(matches)
    })


# ==================== CLAIM ROUTES ====================

@app.route('/api/items/<int:item_id>/claims', methods=['POST'])
@require_auth(role='student')
def submit_claim(item_id):
    data = request.get_json() or {}
    evidence = (data.get('evidence') or '').strip()
    image_proof_url = (data.get('image_proof_url') or '').strip()
    
    if len(evidence) < 5:
        return jsonify({"success": False, "message": "Identifying evidence must be detailed (at least 5 characters)"}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    item = cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        conn.close()
        return jsonify({"success": False, "message": "Item not found"}), 404
        
    if item['reported_by'] == request.user['id']:
        conn.close()
        return jsonify({"success": False, "message": "You cannot submit a claim for an item you reported yourself"}), 400

    existing = cursor.execute(
        "SELECT id FROM claims WHERE item_id = ? AND claimant_id = ? AND status != 'REJECTED'",
        (item_id, request.user['id'])
    ).fetchone()
    
    if existing:
        conn.close()
        return jsonify({"success": False, "message": "You have already submitted an active claim for this item"}), 400

    cursor.execute("""
        INSERT INTO claims (item_id, claimant_id, evidence, image_proof_url, status)
        VALUES (?, ?, ?, ?, 'PENDING')
    """, (item_id, request.user['id'], evidence, image_proof_url))
    
    claim_id = cursor.lastrowid
    
    if item['status'] == 'APPROVED':
        cursor.execute("UPDATE items SET status = 'MATCHED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (item_id,))
        
    log_audit(cursor, item_id, request.user['name'], request.user['role'], "CLAIM_SUBMITTED", f"Submitted claim #{claim_id} with evidence ({'Proof photo attached' if image_proof_url else 'Text evidence'})")
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "message": "Claim & Evidence submitted! Pending administrator verification.",
        "claim_id": claim_id
    }), 201

@app.route('/api/my-claims', methods=['GET'])
@require_auth()
def get_my_claims():
    conn = get_db()
    rows = conn.execute("""
        SELECT c.*, i.title as item_title, i.category, i.location, i.item_type, i.status as item_status, i.image_url, i.is_valuable
        FROM claims c
        JOIN items i ON c.item_id = i.id
        WHERE c.claimant_id = ?
        ORDER BY c.created_at DESC
    """, (request.user['id'],)).fetchall()
    conn.close()
    
    claims = [dict(r) for r in rows]
    return jsonify({"success": True, "claims": claims})


# ==================== ADMIN DASHBOARD, AUDIT & LIFECYCLE ROUTES ====================

@app.route('/api/admin/audit-logs', methods=['GET'])
@require_auth(role='admin')
def get_audit_logs():
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 100
    """).fetchall()
    conn.close()
    return jsonify({"success": True, "logs": [dict(r) for r in rows]})

@app.route('/api/admin/dashboard', methods=['GET'])
@require_auth(role='admin')
def get_admin_dashboard():
    conn = get_db()
    
    total_reports = conn.execute("SELECT COUNT(*) FROM items").fetchone()[0]
    pending_reports = conn.execute("SELECT COUNT(*) FROM items WHERE status = 'PENDING'").fetchone()[0]
    approved_reports = conn.execute("SELECT COUNT(*) FROM items WHERE status = 'APPROVED'").fetchone()[0]
    pending_claims = conn.execute("SELECT COUNT(*) FROM claims WHERE status = 'PENDING'").fetchone()[0]
    returned_items = conn.execute("SELECT COUNT(*) FROM items WHERE status = 'RETURNED'").fetchone()[0]
    
    pending_items_rows = conn.execute("""
        SELECT i.*, u.name as reporter_name, u.email as reporter_email 
        FROM items i
        JOIN users u ON i.reported_by = u.id
        WHERE i.status = 'PENDING'
        ORDER BY i.created_at ASC
    """).fetchall()
    
    pending_claims_rows = conn.execute("""
        SELECT c.*, i.title as item_title, i.description as item_description, i.category, i.location, i.item_type, i.is_valuable,
               u.name as claimant_name, u.email as claimant_email
        FROM claims c
        JOIN items i ON c.item_id = i.id
        JOIN users u ON c.claimant_id = u.id
        WHERE c.status = 'PENDING'
        ORDER BY c.created_at ASC
    """).fetchall()

    conn.close()
    
    return jsonify({
        "success": True,
        "stats": {
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "approved_reports": approved_reports,
            "pending_claims": pending_claims,
            "returned_items": returned_items
        },
        "pending_items": [dict(r) for r in pending_items_rows],
        "pending_claims": [dict(r) for r in pending_claims_rows]
    })

@app.route('/api/admin/items', methods=['GET'])
@require_auth(role='admin')
def get_admin_items():
    conn = get_db()
    rows = conn.execute("""
        SELECT i.*, u.name as reporter_name, u.email as reporter_email
        FROM items i
        JOIN users u ON i.reported_by = u.id
        ORDER BY i.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify({"success": True, "items": [dict(r) for r in rows]})

@app.route('/api/admin/items/<int:item_id>/status', methods=['PUT'])
@require_auth(role='admin')
def update_item_status(item_id):
    data = request.get_json() or {}
    new_status = (data.get('status') or '').strip().upper()
    
    valid_statuses = ['PENDING', 'APPROVED', 'MATCHED', 'CLAIMED', 'RETURNED', 'REJECTED']
    if new_status not in valid_statuses:
        return jsonify({"success": False, "message": f"Invalid status. Must be one of {valid_statuses}"}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    item = cursor.execute("SELECT id, title FROM items WHERE id = ?", (item_id,)).fetchone()
    if not item:
        conn.close()
        return jsonify({"success": False, "message": "Item not found"}), 404
        
    cursor.execute(
        "UPDATE items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (new_status, item_id)
    )
    
    log_audit(cursor, item_id, request.user['name'], request.user['role'], "STATUS_UPDATED", f"Updated item #{item_id} ('{item['title']}') status to {new_status}")
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "message": f"Item status updated to {new_status}"
    })

@app.route('/api/admin/claims', methods=['GET'])
@require_auth(role='admin')
def get_admin_claims():
    conn = get_db()
    rows = conn.execute("""
        SELECT c.*, i.title as item_title, i.description as item_description, i.category, i.location, i.item_type, i.status as item_status, i.is_valuable,
               u.name as claimant_name, u.email as claimant_email
        FROM claims c
        JOIN items i ON c.item_id = i.id
        JOIN users u ON c.claimant_id = u.id
        ORDER BY c.created_at DESC
    """).fetchall()
    conn.close()
    return jsonify({"success": True, "claims": [dict(r) for r in rows]})

@app.route('/api/admin/claims/<int:claim_id>/status', methods=['PUT'])
@require_auth(role='admin')
def update_claim_status(claim_id):
    data = request.get_json() or {}
    new_status = (data.get('status') or '').strip().upper()
    admin_notes = (data.get('admin_notes') or '').strip()
    
    if new_status not in ['APPROVED', 'REJECTED']:
        return jsonify({"success": False, "message": "Claim status must be APPROVED or REJECTED"}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    claim = cursor.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    if not claim:
        conn.close()
        return jsonify({"success": False, "message": "Claim not found"}), 404
        
    cursor.execute("""
        UPDATE claims 
        SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    """, (new_status, admin_notes, claim_id))
    
    if new_status == 'APPROVED':
        cursor.execute("""
            UPDATE items 
            SET status = 'CLAIMED', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (claim['item_id'],))
        
    log_audit(cursor, claim['item_id'], request.user['name'], request.user['role'], "CLAIM_VERIFIED", f"Admin {new_status} claim #{claim_id} with notes: '{admin_notes or 'Verified'}'")
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "message": f"Claim status updated to {new_status}"
    })


if __name__ == '__main__':
    print("Starting CampusFind Flask Backend on http://localhost:5000 ...")
    app.run(host='0.0.0.0', port=5000, debug=True)
