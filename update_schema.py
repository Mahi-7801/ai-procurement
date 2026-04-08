import sqlite3
import os

db_paths = [
    r'c:\Users\ameer\Downloads\san_nans\san_nans\New folder_at_present\AI-Procurement\backend\rtgs_procurement.db',
    r'c:\Users\ameer\Downloads\san_nans\san_nans\New folder_at_present\AI-Procurement\rtgs_procurement.db'
]

for db_path in db_paths:
    if not os.path.exists(db_path):
        print(f"Skipping {db_path} - Not found")
        continue

    print(f"Applying schema changes to {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("eligibility_score", "FLOAT"),
        ("experience_score", "FLOAT"),
        ("specs_score", "FLOAT"),
        ("docs_score", "FLOAT"),
        ("final_score", "FLOAT"),
        ("ai_analysis", "TEXT")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE bids ADD COLUMN {col_name} {col_type}")
            print(f"  Added column {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"  Column {col_name} already exists")
            else:
                print(f"  Error adding column {col_name}: {e}")

    conn.commit()
    conn.close()
