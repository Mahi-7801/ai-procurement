import sqlite3
import os

db_path = r'c:\Users\ameer\Downloads\san_nans\san_nans\New folder_at_present\AI-Procurement\backend\rtgs_procurement.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(bids)")
for col in cursor.fetchall():
    print(col)

conn.close()
