import os
import json
from dotenv import load_dotenv
import pymysql

load_dotenv('backend/.env')

try:
    conn = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME')
    )
    cursor = conn.cursor()

    metadata = {
        "emdAmount": "45,000",
        "emdMode": "Online",
        "turnoverLimit": "5.0",
        "experienceLimit": "3",
        "category": "IT Equipment",
        "technicalSpecs": [
            "Intel Core i7 13th Gen or higher",
            "16GB DDR5 RAM",
            "512GB NVMe SSD",
            "Windows 11 Pro"
        ]
    }

    cursor.execute("""
        UPDATE tenders 
        SET description = %s, project_name = 'Supply of IT Products & Laptops'
        WHERE tender_id = 'TDR-2026-001'
    """, (json.dumps(metadata),))
    
    conn.commit()
    print("Tender TDR-2026-001 updated successfully with IT-specific metadata.")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
