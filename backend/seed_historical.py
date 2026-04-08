import pymysql
import os
from datetime import datetime
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Historical Database configuration (MySQL/XAMPP)
HISTORICAL_DATABASE_URL = os.getenv(
    "HISTORICAL_DATABASE_URL",
    "mysql+pymysql://root:@localhost:3306/ai_procurement"
)

# Parse the URL (simple parser)
# Format: mysql+pymysql://user:password@host:port/dbname
try:
    url_parts = HISTORICAL_DATABASE_URL.split("://")[1]
    auth_part, host_part = url_parts.split("@")
    user, password = auth_part.split(":") if ":" in auth_part else (auth_part, "")
    host_port, dbname = host_part.split("/")
    host, port = host_port.split(":") if ":" in host_port else (host_port, 3306)
    port = int(port)
except Exception:
    # Fallback to defaults
    user, password, host, port, dbname = "root", "", "localhost", 3307, "historical_procuresmart_db"

def seed_historical_data():
    """Seed the MySQL/XAMPP database with historical bid data as per Master Plan"""
    try:
        connection = pymysql.connect(host=host, user=user, password=password, port=port)
        cursor = connection.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {dbname}")
        cursor.execute(f"USE {dbname}")
        
        # Create table exactly as per Master Plan requirements
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS historical_bids (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bid_number VARCHAR(100) UNIQUE,
                title VARCHAR(500) NOT NULL,
                bid_type ENUM('SERVICE','PRODUCT') NOT NULL,
                category VARCHAR(200),
                keywords TEXT,
                ministry VARCHAR(255),
                department VARCHAR(255),
                organisation VARCHAR(255),
                estimated_value DECIMAL(15,2),
                emd_amount DECIMAL(15,2),
                epbg_percent DECIMAL(5,2),
                contract_period VARCHAR(100),
                validity_days INT,
                experience_years INT,
                turnover_percent DECIMAL(5,2),
                ld_percent DECIMAL(5,2),
                security_deposit DECIMAL(5,2),
                standard_clauses TEXT,
                pdf_filename VARCHAR(500),
                data_source ENUM('PDF_UPLOAD', 'USER_FORM') DEFAULT 'PDF_UPLOAD',
                template_data JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Core Master Plan Seed Data
        historical_data = [
            {
                "bid_number": "GEM-8893349",
                "title": "Mine Development and Operation of Opencast Manganese Ore Mine",
                "bid_type": "SERVICE",
                "category": "Mining Services",
                "keywords": "mine, mining, development, operation, manganese, ore, opencast, moil, steel, extraction",
                "ministry": "Ministry of Steel",
                "department": "Infrastructure",
                "organisation": "MOIL Limited",
                "estimated_value": 75000000.00,
                "emd_amount": 10000.00,
                "epbg_percent": 5.0,
                "contract_period": "1 Year 7 Days",
                "validity_days": 120,
                "experience_years": 3,
                "turnover_percent": 30.0,
                "ld_percent": 0.5,
                "security_deposit": 5.0,
                "standard_clauses": "Labour Clauses, PF, ESI, Minimum Wages Applicable. Integrity Pact required for values > 50L.",
                "pdf_filename": "GeM-Bidding-8893349.pdf",
                "template_data": {"labor_compliance": True, "integrity_pact": True}
            },
            {
                "bid_number": "GEM-7166444",
                "title": "Supply of Apple iPad 10.9 Inch (Wi-Fi Only)",
                "bid_type": "PRODUCT",
                "category": "Computers & IT",
                "keywords": "ipad, tablet, apple, mobile, computing, electronics, ios, handheld, tablet pc",
                "ministry": "Ministry of Defence",
                "department": "Army",
                "organisation": "Central Command",
                "estimated_value": 1500000.00,
                "emd_amount": 0.0,
                "epbg_percent": 0.0,
                "contract_period": "15 Days",
                "validity_days": 30,
                "experience_years": 1,
                "turnover_percent": 10.0,
                "ld_percent": 0.5,
                "security_deposit": 0.0,
                "standard_clauses": "Warranty: 1 Year. 7-day rectification period for IT products.",
                "pdf_filename": "GeM-Bidding-7166444.pdf",
                "template_data": {"warranty": "1 Year", "mii_compliance": False}
            }
        ]
        
        for item in historical_data:
            cols = ", ".join(item.keys())
            placeholders = ", ".join(["%s"] * len(item))
            sql = f"INSERT INTO historical_bids ({cols}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE title=VALUES(title), keywords=VALUES(keywords)"
            
            # Convert dict to JSON string for MySQL
            values = []
            for k, v in item.items():
                if k == "template_data":
                    values.append(json.dumps(v))
                else:
                    values.append(v)
                    
            cursor.execute(sql, tuple(values))
            
        connection.commit()
        print(f"Successfully seeded {len(historical_data)} master historical records into MySQL.")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    seed_historical_data()
