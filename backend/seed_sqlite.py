import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from database.connection import HistoricalSessionLocal, engine, historical_engine
from database.models import Base, HistoricalBid, BidType, DataSource

def seed_historical_data():
    """Seed the historical database with demo procurement records"""
    print("Starting database initialization...")
    # Ensure tables are created
    from database.models import Base
    Base.metadata.create_all(bind=engine)
    Base.metadata.create_all(bind=historical_engine)
    
    db = HistoricalSessionLocal()
    try:
        # Check if already seeded
        if db.query(HistoricalBid).count() > 0:
            print("Historical database already has data. Skipping seed.")
            return

        print("Seeding historical bids...")
        historical_records = [
            {
                "bid_number": "GEM-8893349",
                "title": "Mine Development and Operation of Opencast Manganese Ore Mine",
                "bid_type": BidType.SERVICE,
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
                "bid_type": BidType.PRODUCT,
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
            },
            {
                "bid_number": "GEM/2024/B/521980",
                "title": "Annual Maintenance Contract (AMC) for Air Conditioners",
                "bid_type": BidType.SERVICE,
                "category": "Catering Services", # Kept intentionally for testing filtering
                "keywords": "amc, ac, cooling, maintenance",
                "ministry": "Ministry of Commerce",
                "department": "Department of Commerce",
                "organisation": "STC",
                "estimated_value": 1200000,
                "emd_amount": 24000,
                "epbg_percent": 5,
                "contract_period": "365 Days",
                "validity_days": 180,
                "experience_years": 5,
                "turnover_percent": 200,
                "ld_percent": 2.0,
                "security_deposit": 5,
                "standard_clauses": "Payment on monthly basis",
                "pdf_filename": "tender_ac_amc_2024.pdf",
                "data_source": DataSource.USER_FORM,
                "template_data": {},
            },
            {
                "bid_number": "GEM/2024/B/533102",
                "title": "Security Manpower Services for Government Office",
                "bid_type": BidType.SERVICE,
                "category": "Manpower Services",
                "keywords": "security, guards, manpower, safety",
                "ministry": "Ministry of Home Affairs",
                "department": "CISF",
                "organisation": "Office of the IG",
                "estimated_value": 25000000,
                "emd_amount": 500000,
                "epbg_percent": 10,
                "contract_period": "730 Days",
                "validity_days": 180,
                "experience_years": 3,
                "turnover_percent": 300,
                "ld_percent": 1.0,
                "security_deposit": 10,
                "standard_clauses": "Labor laws compliance mandatory",
                "pdf_filename": "tender_security_2024.pdf",
                "data_source": DataSource.USER_FORM,
                "template_data": {},
            }
        ]

        for record in historical_records:
            bid = HistoricalBid(**record)
            db.add(bid)
        
        db.commit()
        print(f"Successfully seeded {len(historical_records)} records.")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_historical_data()
