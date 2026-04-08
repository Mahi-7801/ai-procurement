
import os
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://neondb_owner:npg_4RNwBEJ0lZrk@ep-long-wildflower-am15eywn-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print(f"Testing connection to Neon DB...")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT now()"))
        now = result.scalar()
        print(f"✅ Success! Connection established.")
        print(f"Current server time: {now}")
        
        result = conn.execute(text("SELECT version()"))
        version = result.scalar()
        print(f"Server version: {version}")
        
except Exception as e:
    print(f"❌ Connection failed!")
    print(f"Error: {e}")
