
from database.connection import engine
from sqlalchemy import text

def migrate():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE bids ADD COLUMN submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
            print("Added submitted_at")
        except Exception as e:
            print("submitted_at error:", e)

        try:
            conn.execute(text("ALTER TABLE bids ADD COLUMN evaluated_at DATETIME"))
            print("Added evaluated_at")
        except Exception as e:
            print("evaluated_at error:", e)

        try:
            conn.execute(text("ALTER TABLE bids ADD COLUMN evaluated_by INT"))
            print("Added evaluated_by")
        except Exception as e:
            print("evaluated_by error:", e)

        try:
            conn.execute(text("ALTER TABLE bids ADD CONSTRAINT fk_bids_evaluated_by FOREIGN KEY (evaluated_by) REFERENCES users(id)"))
            print("Added fk_bids_evaluated_by")
        except Exception as e:
            print("fk_bids_evaluated_by error:", e)

if __name__ == "__main__":
    migrate()
