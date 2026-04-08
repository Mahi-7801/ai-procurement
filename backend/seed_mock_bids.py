
import os
from datetime import datetime
from database.connection import SessionLocal
from database.models import Bid, Vendor, Tender, User, UserRole, BidStatus

def seed_bids():
    db = SessionLocal()
    try:
        # Find the Laptops tender
        tender = db.query(Tender).filter(Tender.project_name.like('%Laptop%')).first()
        if not tender:
            print("Laptops tender not found!")
            return

        # Make sure we have enough vendors
        vendors = db.query(Vendor).all()
        if len(vendors) < 3:
            # Check users
            users = db.query(User).filter(User.role == UserRole.VENDOR).all()
            for idx, u in enumerate(users):
                existing_vendor = db.query(Vendor).filter(Vendor.user_id == u.id).first()
                if not existing_vendor:
                    new_vendor = Vendor(
                        user_id=u.id, 
                        vendor_name=f"{u.full_name} Enterprises", 
                        vendor_code=f"VEND-{u.id}"
                    )
                    db.add(new_vendor)
            db.commit()
            vendors = db.query(Vendor).all()
        
        # Still not enough? Create raw ones
        while len(vendors) < 3:
            u = User(username=f"mock_vendor_{len(vendors)}", email=f"mock{len(vendors)}@v.com", hashed_password="pw", full_name="Mock Vendor", role=UserRole.VENDOR)
            db.add(u)
            db.commit()
            v = Vendor(user_id=u.id, vendor_name=f"Mock Vendor {len(vendors)} Solutions", vendor_code=f"VND-M{len(vendors)}")
            db.add(v)
            db.commit()
            vendors = db.query(Vendor).all()

        # Delete any existing bids for safety
        db.query(Bid).filter(Bid.tender_id == tender.id).delete()
        
        # Seed 3 bids
        budgets = [tender.estimated_budget * 0.9, tender.estimated_budget * 0.5, tender.estimated_budget * 1.1]
        tech_scores = [85, 95, 75]
        
        for i, vendor in enumerate(vendors[:3]):
            bid = Bid(
                tender_id=tender.id,
                vendor_id=vendor.id,
                financial_bid=budgets[i],
                technical_score=tech_scores[i],
                technical_compliance=tech_scores[i],
                final_score=tech_scores[i] + (10 if i == 0 else 5),
                eligibility_score=20.0,
                experience_score=15.0,
                specs_score=20.0,
                docs_score=tech_scores[i] - 55,
                financial_evaluation=10.0,
                is_draft=False,
                status=BidStatus.EVALUATED,
                submitted_at=datetime.utcnow()
            )
            db.add(bid)
            
        db.commit()
        print("Successfully seeded bids!")

    except Exception as e:
        print(f"Error seeding bids: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_bids()
