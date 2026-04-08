
import pymysql
import os
from dotenv import load_dotenv

load_dotenv('c:/Users/bidal/Downloads/san_nans (2)/san_nans/New folder_at_present/AI-Procurement/backend/.env')

db_url = os.getenv("DATABASE_URL")

try:
    part1 = db_url.split('://')[1]
    creds, host_port_db = part1.split('@')
    user, password = creds.split(':')
    host_port, db_name = host_port_db.split('/')
    host, port = host_port.split(':')
    password = password.replace('%40', '@')

    conn = pymysql.connect(host=host, port=int(port), user=user, password=password, database=db_name)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, tender_id, from_user_id, from_role, to_role, to_user_id, subject FROM communications ORDER BY id DESC LIMIT 10;")
    rows = cursor.fetchall()
    
    print(f"{'ID':<5} | {'Tender':<5} | {'Fr_UID':<6} | {'From':<15} | {'To':<15} | {'To_UID':<6} | {'Subject'}")
    print("-" * 100)
    for row in rows:
        print(f"{row[0]:<5} | {row[1]:<5} | {row[2]:<6} | {row[3]:<15} | {row[4]:<15} | {row[5] if row[5] else 'None':<6} | {row[6]}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
