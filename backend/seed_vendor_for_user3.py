import os
import pymysql
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

host = os.getenv("DB_HOST", "localhost")
user = os.getenv("DB_USER", "root")
password = os.getenv("DB_PASSWORD", "")
port = int(os.getenv("DB_PORT", "3306"))
dbname = os.getenv("DB_NAME", "ai_procurement")

try:
    conn = pymysql.connect(host=host, user=user, password=password, port=port, db=dbname)
    with conn.cursor() as cursor:
        # Check if user 3 exists
        cursor.execute("SELECT id, full_name, email FROM users WHERE id = 3")
        user_data = cursor.fetchone()
        
        if not user_data:
            print("User with ID 3 not found. Cannot seed vendor.")
            exit(1)
            
        uid, name, email = user_data
        print(f"Found User: {name} (ID: {uid})")
        
        # Check if vendor already exists for this user
        cursor.execute("SELECT id FROM vendors WHERE user_id = 3")
        if cursor.fetchone():
            print("Vendor record already exists for User 3.")
        else:
            print("Creating vendor record for User 3...")
            vendor_code = f"VND-{uid}-2026"
            cursor.execute("""
                INSERT INTO vendors (vendor_code, vendor_name, gstin, pan, email, phone, address, is_blacklisted, user_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                vendor_code, 
                f"{name} Solutions", 
                "37AAAAA0000A1Z5", 
                "ABCDE1234F", 
                email, 
                "9876543210", 
                "Main Street, Vijayawada", 
                0, 
                uid,
                datetime.now(),
                datetime.now()
            ))
            print(f"Vendor record created with code {vendor_code}.")
            
        conn.commit()
    conn.close()
    print("Seeding completed.")
except Exception as ex:
    print(f"Error: {ex}")
