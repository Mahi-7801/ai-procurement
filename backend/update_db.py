import sqlite3
import os

db_path = r'c:\Users\ameer\Downloads\san_nans\san_nans\New folder_at_present\AI-Procurement\backend\rtgs_procurement.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE bids ADD COLUMN is_draft BOOLEAN DEFAULT 0")
        print("Added is_draft column")
    except sqlite3.OperationalError:
        print("is_draft already exists")
        
    try:
        cursor.execute("ALTER TABLE bids ADD COLUMN compliance_report JSON")
        print("Added compliance_report column")
    except sqlite3.OperationalError:
        print("compliance_report already exists")
        
    conn.commit()
    conn.close()
else:
    print(f"DB not found at {db_path}")
