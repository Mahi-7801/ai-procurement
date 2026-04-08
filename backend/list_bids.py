
from database.connection import SessionLocal
from database.models import Bid, Vendor, Tender

db = SessionLocal()
bids = db.query(Bid).all()
print(f"Total Bids Found: {len(bids)}")
for bid in bids:
    vendor = db.query(Vendor).filter(Vendor.id == bid.vendor_id).first()
    tender = db.query(Tender).filter(Tender.id == bid.tender_id).first()
    print(f"Bid ID: {bid.id}, Vendor: {vendor.vendor_name if vendor else 'Unknown'}, Tender: {tender.tender_id if tender else 'Unknown'}")
db.close()
