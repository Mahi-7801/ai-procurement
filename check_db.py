import sqlite3
import json
import os

db_path = r'c:\Users\ameer\Downloads\san_nans\san_nans\New folder_at_present\AI-Procurement\backend\rtgs_procurement.db'
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- TENDERS ---")
cursor.execute("SELECT id, tender_id, project_name FROM tenders")
for row in cursor.fetchall():
    print(row)

print("\n--- BIDS ---")
cursor.execute("SELECT id, tender_id, vendor_id, financial_bid, rank, final_score FROM bids")
for row in cursor.fetchall():
    print(row)

print("\n--- VENDORS ---")
cursor.execute("SELECT id, vendor_name FROM vendors")
for row in cursor.fetchall():
    print(row)

conn.close()
