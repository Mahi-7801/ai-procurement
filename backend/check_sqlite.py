
import sqlite3
import os

db_file = "rtgs_procurement.db"
if os.path.exists(db_file):
    try:
        conn = sqlite3.connect(db_file)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='bids'")
        if cur.fetchone():
            cur.execute("SELECT COUNT(*) FROM bids")
            count = cur.fetchone()[0]
            print(f"SQLite Count: {count}")
        else:
            print("Table 'bids' not found in SQLite.")
        conn.close()
    except Exception as e:
        print(f"SQLite Error: {e}")
else:
    print("rtgs_procurement.db NOT found.")
