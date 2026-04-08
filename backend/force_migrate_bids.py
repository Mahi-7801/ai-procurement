
from database.connection import engine
from sqlalchemy import text, inspect

def migrate():
    with engine.begin() as conn:
        inspector = inspect(engine)
        columns = [c['name'].lower() for c in inspector.get_columns('bids')]
        
        # Check all required columns
        required = {
            'status': "ENUM('DRAFT', 'SUBMITTED', 'VALIDATED', 'EVALUATED') DEFAULT 'DRAFT'",
            'submission_duration_ms': "INT",
            'submitted_at': "DATETIME DEFAULT CURRENT_TIMESTAMP",
            'evaluated_at': "DATETIME",
            'evaluated_by': "INT"
        }
        
        for col, col_type in required.items():
            if col not in columns:
                print(f"Adding '{col}' column to 'bids'")
                conn.execute(text(f"ALTER TABLE bids ADD COLUMN {col} {col_type}"))
                if col == 'evaluated_by':
                    print("Adding FK for evaluated_by")
                    try:
                        conn.execute(text("ALTER TABLE bids ADD CONSTRAINT fk_bids_evaluated_by FOREIGN KEY (evaluated_by) REFERENCES users(id)"))
                    except Exception as e:
                        print(f"FK error: {e}")

    print("Forced migration complete!")

if __name__ == "__main__":
    migrate()
