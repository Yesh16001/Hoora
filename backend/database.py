import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'campusfind.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def log_audit(cursor_or_conn, item_id, actor_name, actor_role, action, details):
    try:
        cursor_or_conn.execute('''
            INSERT INTO audit_logs (item_id, actor_name, actor_role, action, details)
            VALUES (?, ?, ?, ?, ?)
        ''', (item_id, actor_name, actor_role, action, details))
    except Exception as e:
        print(f"Audit log error: {e}")

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Create USERS table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create ITEMS table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            item_type TEXT NOT NULL,
            location TEXT NOT NULL,
            item_date TEXT NOT NULL,
            contact_info TEXT,
            status TEXT NOT NULL DEFAULT 'PENDING',
            reported_by INTEGER NOT NULL,
            image_url TEXT,
            is_valuable INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (reported_by) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')

    # Create CLAIMS table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            claimant_id INTEGER NOT NULL,
            evidence TEXT NOT NULL,
            image_proof_url TEXT,
            status TEXT NOT NULL DEFAULT 'PENDING',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE,
            FOREIGN KEY (claimant_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')

    # Create AUDIT_LOGS table for Human-in-the-Loop Audit Trail
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER,
            actor_name TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Seed data if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("Seeding demo database with audit history...")
        
        admin_pass = generate_password_hash("admin123")
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("Campus Administrator", "admin@campusfind.edu", admin_pass, "admin")
        )
        
        student_pass = generate_password_hash("student123")
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("Rahul Sharma", "student@campusfind.edu", student_pass, "student")
        )
        
        john_pass = generate_password_hash("john123")
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("John Doe", "john@campusfind.edu", john_pass, "student")
        )
        
        demo_items = [
            (
                "Black leather wallet",
                "Black wallet with small red mark on the inner flap containing student ID card and cash.",
                "Accessories",
                "LOST",
                "Library",
                "2026-09-28",
                "Ph: 9876543210",
                "APPROVED",
                2,
                "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80",
                0
            ),
            (
                "Black wallet",
                "Small black leather wallet found near study desk in central library second floor.",
                "Accessories",
                "FOUND",
                "Library",
                "2026-09-29",
                "Found by library staff desk",
                "APPROVED",
                3,
                "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80",
                0
            )
        ]
        
        for title, desc, cat, itype, loc, idate, contact, status, uid, img, is_val in demo_items:
            cursor.execute('''
                INSERT INTO items 
                (title, description, category, item_type, location, item_date, contact_info, status, reported_by, image_url, is_valuable)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (title, desc, cat, itype, loc, idate, contact, status, uid, img, is_val))
            
            log_audit(cursor, cursor.lastrowid, "System Seed", "system", "ITEM_REPORTED", f"Created initial {itype} report: {title}")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Database updated with AUDIT_LOGS table successfully!")
