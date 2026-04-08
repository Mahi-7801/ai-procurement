
from database.connection import SessionLocal
from database.models import User, UserRole, Bid, Notification, Vendor, Tender

db = SessionLocal()
bid_id = 1
bid = db.query(Bid).filter(Bid.id == bid_id).first()
if not bid:
    print(f"FAILED: Bid {bid_id} not found in check script!")
else:
    print(f"SUCCESS: Bid {bid_id} found. Vendor ID: {bid.vendor_id}, Tender ID: {bid.tender_id}")
    if bid.tender:
        print(f"Tender Name: {bid.tender.project_name}")
    if bid.vendor:
        print(f"Vendor User ID: {bid.vendor.user_id}")
db.close()
