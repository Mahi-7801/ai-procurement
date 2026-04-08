
import sqlite3
import os

db_path = 'c:/Users/bidal/Downloads/san_nans (2)/san_nans/New folder_at_present/AI-Procurement/backend/rtgs_procurement.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, tender_id, from_role, to_role, subject, message FROM communications ORDER BY id DESC LIMIT 10;")
    rows = cursor.fetchall()
    
    print(f"{'ID':<5} | {'Tender':<5} | {'From':<15} | {'To':<15} | {'Subject'}")
    print("-" * 80)
    for row in rows:
        print(f"{row[0]:<5} | {row[1]:<5} | {row[2]:<15} | {row[3]:<15} | {row[4]}")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
