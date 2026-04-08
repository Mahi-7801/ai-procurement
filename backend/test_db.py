import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Testing connection to: {DATABASE_URL.split('@')[1]}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        print(f"SUCCESS: {result.fetchone()[0]}")
except Exception as e:
    print(f"FAILED: {e}")
