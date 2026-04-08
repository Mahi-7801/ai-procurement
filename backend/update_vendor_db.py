from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Adding columns to vendors table...")
    try:
        conn.execute(text("ALTER TABLE vendors ADD COLUMN is_msme BOOLEAN DEFAULT FALSE"))
    except Exception as e:
        print(f"is_msme: {e}")
        
    try:
        conn.execute(text("ALTER TABLE vendors ADD COLUMN is_startup BOOLEAN DEFAULT FALSE"))
    except Exception as e:
        print(f"is_startup: {e}")
        
    try:
        conn.execute(text("ALTER TABLE vendors ADD COLUMN experience_years INTEGER DEFAULT 0"))
    except Exception as e:
        print(f"experience_years: {e}")
        
    try:
        conn.execute(text("ALTER TABLE vendors ADD COLUMN turnover FLOAT DEFAULT 0.0"))
    except Exception as e:
        print(f"turnover: {e}")
        
    conn.commit()
    print("Done.")
