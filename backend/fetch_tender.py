from database.connection import SessionLocal
from database.models import Tender
import json

db = SessionLocal()
tender = db.query(Tender).filter(Tender.tender_id == 'TDR-2026-001').first()
if tender:
    data = json.loads(tender.description)
    for k, v in data.items():
        if 'emd' in k.lower():
            print(f"{k}: {v}")
db.close()
