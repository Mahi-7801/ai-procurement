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
    # Try connect with db first
    conn = pymysql.connect(host=host, user=user, password=password, port=port, db=dbname)
    print(f"Successfully connected to database: {dbname}")
    
    with conn.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"Tables: {[t[0] for t in tables]}")
        
    conn.close()
except pymysql.MySQLError as e:
    print(f"Error connecting to database '{dbname}': {e}")
    # Try connect without db
    try:
        conn = pymysql.connect(host=host, user=user, password=password, port=port)
        with conn.cursor() as cursor:
            cursor.execute("SHOW DATABASES")
            dbs = cursor.fetchall()
            print(f"Available Databases: {[db[0] for db in dbs]}")
        conn.close()
    except Exception as e2:
        print(f"Critical error: {e2}")
