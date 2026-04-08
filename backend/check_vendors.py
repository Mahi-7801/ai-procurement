from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    res = conn.execute(text("SELECT * FROM vendors"))
    print([dict(row._mapping) for row in res])
