import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("DB_HOST", "localhost")
user = os.getenv("DB_USER", "root")
password = os.getenv("DB_PASSWORD", "")
port = int(os.getenv("DB_PORT", "3306"))
dbname = os.getenv("DB_NAME", "ai_procurement")

try:
    conn = pymysql.connect(host=host, user=user, password=password, port=port, db=dbname)
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, username, email, full_name, role FROM users")
        users = cursor.fetchall()
        print("Users in database:")
        for u in users:
            print(f"ID: {u[0]}, Username: {u[1]}, Email: {u[2]}, Name: {u[3]}, Role: {u[4]}")
            
        cursor.execute("SELECT id, vendor_name, user_id FROM vendors")
        vendors = cursor.fetchall()
        print("\nVendors in database:")
        for v in vendors:
            print(f"ID: {v[0]}, Name: {v[1]}, Linked User ID: {v[2]}")
            
    conn.close()
except Exception as ex:
    print(f"Error: {ex}")
