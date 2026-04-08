import sqlite3
import os

db_path = r'c:\Users\ameer\Downloads\san_nans\san_nans\New folder_at_present\AI-Procurement\backend\rtgs_procurement.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- BID DATA (ID, Price, TechScore, FinScore) ---")
cursor.execute("SELECT id, financial_bid, technical_score, financial_evaluation FROM bids")
for row in cursor.fetchall():
    print(row)

conn.close()
