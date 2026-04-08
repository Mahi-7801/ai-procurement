
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
    
    cursor.execute("SELECT id, username, full_name, role FROM users WHERE username LIKE 'Venkatesh%';")
    rows = cursor.fetchall()
    
    print(f"{'ID':<5} | {'Username':<15} | {'Role'}")
    print("-" * 40)
    for row in rows:
        print(f"{row[0]:<5} | {row[1]:<15} | {row[3]}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
