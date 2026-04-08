from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    conn.execute(text("UPDATE vendors SET is_msme=1, is_startup=1, experience_years=5, turnover=12.5 WHERE user_id=3"))
    conn.commit()
    print("Updated vendor profile for test user.")
