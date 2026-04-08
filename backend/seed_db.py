import os
import bcrypt
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def seed_user():
    email = "causeofatbidalert@gmail.com"
    password = "darasmart@123"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    with engine.connect() as conn:
        # Check if user exists
        res = conn.execute(text("SELECT id FROM users WHERE email = :email"), {"email": email}).fetchone()
        if not res:
            conn.execute(
                text("INSERT INTO users (username, email, hashed_password, full_name, role, is_active) VALUES (:username, :email, :hashed, :name, :role, :active)"),
                {
                    "username": "mahi12",
                    "email": email,
                    "hashed": hashed,
                    "name": "Mahi Officer",
                    "role": "PROCUREMENT_OFFICER",
                    "active": True
                }
            )
            conn.commit()

            print(f"SUCCESS: Created user {email}")
        else:
            print(f"INFO: User {email} already exists")

if __name__ == "__main__":
    seed_user()
