
from database.connection import engine
from sqlalchemy import text, inspect

def migrate():
    # Columns to add to 'bids' table
    # status, submission_duration_ms, submitted_at, evaluated_at, evaluated_by
    
    with engine.begin() as conn:
        inspector = inspect(engine)
        columns = [c['name'] for c in inspector.get_columns('bids')]
        
        if 'status' not in columns:
            print("Adding 'status' column to 'bids'")
            conn.execute(text("ALTER TABLE bids ADD COLUMN status ENUM('DRAFT', 'SUBMITTED', 'VALIDATED', 'EVALUATED') DEFAULT 'DRAFT'"))
        
        if 'submission_duration_ms' not in columns:
            print("Adding 'submission_duration_ms' column to 'bids'")
            conn.execute(text("ALTER TABLE bids ADD COLUMN submission_duration_ms INT"))
            
        if 'submitted_at' not in columns:
            print("Adding 'submitted_at' column to 'bids'")
            conn.execute(text("ALTER TABLE bids ADD COLUMN submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
            
        if 'evaluated_at' not in columns:
            print("Adding 'evaluated_at' column to 'bids'")
            conn.execute(text("ALTER TABLE bids ADD COLUMN evaluated_at DATETIME"))
            
        if 'evaluated_by' not in columns:
            print("Adding 'evaluated_by' column to 'bids'")
            conn.execute(text("ALTER TABLE bids ADD COLUMN evaluated_by INT"))
            conn.execute(text("ALTER TABLE bids ADD CONSTRAINT fk_bids_evaluated_by FOREIGN KEY (evaluated_by) REFERENCES users(id)"))

    print("Migration complete!")

if __name__ == "__main__":
    migrate()
