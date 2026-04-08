
import sqlite3
import os

db_path = 'c:/Users/bidal/Downloads/san_nans (2)/san_nans/New folder_at_present/AI-Procurement/backend/rtgs_procurement.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, tender_ref, status FROM tenders;")
    rows = cursor.fetchall()
    
    print(f"{'ID':<5} | {'Ref':<15} | {'Status'}")
    print("-" * 40)
    for row in rows:
        print(f"{row[0]:<5} | {row[1]:<15} | {row[2]}")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
