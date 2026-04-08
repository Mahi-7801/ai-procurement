
import pymysql
import os
from dotenv import load_dotenv

load_dotenv('c:/Users/bidal/Downloads/san_nans (2)/san_nans/New folder_at_present/AI-Procurement/backend/.env')

db_url = os.getenv("DATABASE_URL")
# mysql+pymysql://bidalert:bidalert!123%40vcs@127.0.0.1:3306/ai-procurement

try:
    # Manual parse because I don't want to install sqlalchemy in this script
    part1 = db_url.split('://')[1]
    creds, host_port_db = part1.split('@')
    user, password = creds.split(':')
    host_port, db_name = host_port_db.split('/')
    host, port = host_port.split(':')
    
    # Handle encoded characters
    password = password.replace('%40', '@')

    conn = pymysql.connect(
        host=host,
        port=int(port),
        user=user,
        password=password,
        database=db_name
    )
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, full_name, role FROM users;")
    rows = cursor.fetchall()
    
    print(f"{'ID':<5} | {'Username':<15} | {'Full Name':<20} | {'Role'}")
    print("-" * 60)
    for row in rows:
        print(f"{row[0]:<5} | {row[1]:<15} | {row[2]:<20} | {row[3]}")
        
    cursor.execute("SELECT id, tender_id, from_role, to_role, subject FROM communications ORDER BY id DESC LIMIT 5;")
    rows = cursor.fetchall()
    print(f"\nRecent Communications:")
    print(f"{'ID':<5} | {'Tender':<15} | {'From':<15} | {'To':<15} | {'Subject'}")
    print("-" * 80)
    for row in rows:
        print(f"{row[0]:<5} | {row[1]:<15} | {row[2]:<15} | {row[3]:<15} | {row[4]}")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
