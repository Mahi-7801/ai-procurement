
import sqlite3
import os

db_path = 'c:/Users/bidal/Downloads/san_nans (2)/san_nans/New folder_at_present/AI-Procurement/database_files/rtgs_procurement.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, full_name, role FROM users;")
    rows = cursor.fetchall()
    
    print(f"{'ID':<5} | {'Username':<15} | {'Full Name':<20} | {'Role'}")
    print("-" * 60)
    for row in rows:
        print(f"{row[0]:<5} | {row[1]:<15} | {row[2]:<20} | {row[3]}")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
