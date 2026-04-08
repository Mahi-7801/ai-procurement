
from database.connection import SessionLocal
from database.models import Tender

db = SessionLocal()
tenders = db.query(Tender).all()
print("ID | TENDER_ID | PROJECT_NAME")
print("-" * 30)
for t in tenders:
    print(f"{t.id} | {t.tender_id} | {t.project_name}")
db.close()
