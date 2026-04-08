import sqlite3
import os

db_paths = [
    r'c:\Users\ameer\Downloads\san_nans\san_nans\New folder_at_present\AI-Procurement\backend\rtgs_procurement.db',
    r'c:\Users\ameer\Downloads\san_nans\san_nans\New folder_at_present\AI-Procurement\rtgs_procurement.db'
]

for db_path in db_paths:
    if not os.path.exists(db_path):
        continue

    print(f"--- DB: {db_path} ---")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("--- BIDS ---")
    cursor.execute("SELECT id, tender_id, vendor_id, financial_bid, technical_score, final_score FROM bids")
    for row in cursor.fetchall():
        print(row)

    print("\n--- VENDORS ---")
    cursor.execute("SELECT id, vendor_name FROM vendors")
    for row in cursor.fetchall():
        print(row)

    conn.close()
