import sqlite3
import os

def fix_and_seed_vendors():
    db_path = 'rtgs_procurement.db'
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Ensure column exists
        cursor.execute("PRAGMA table_info(vendors)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'user_id' not in columns:
            print("Adding user_id column to vendors table...")
            cursor.execute("ALTER TABLE vendors ADD COLUMN user_id INTEGER REFERENCES users(id)")
            conn.commit()

        # 2. Add a vendor record if empty
        cursor.execute("SELECT COUNT(*) FROM vendors")
        vendor_count = cursor.fetchone()[0]
        
        if vendor_count == 0:
            print("No vendors found. Seeding a vendor for Vjay Kumar...")
            # We know Vjay Kumar is ID 2 from our check
            cursor.execute("""
                INSERT INTO vendors (vendor_code, vendor_name, gstin, pan, email, phone, address, is_blacklisted, user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            """, (
                "VND-2024-001", 
                "Vjay Kumar Enterprises", 
                "37AAAAA0000A1Z5", 
                "ABCDE1234F", 
                "vjay@example.com", 
                "9876543210", 
                "Vijayawada, Andhra Pradesh", 
                0, 
                2
            ))
            conn.commit()
            print("Vendor record created.")
        else:
            print(f"Already have {vendor_count} vendors. Linking user if needed...")
            cursor.execute("UPDATE vendors SET user_id = 2 WHERE user_id IS NULL OR user_id = ''")
            conn.commit()

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_and_seed_vendors()
