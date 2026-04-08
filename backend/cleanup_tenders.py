from database.connection import SessionLocal
from database.models import Tender, TenderStatus

def cleanup_cancelled_tenders():
    db = SessionLocal()
    try:
        # Delete all tenders that are cancelled
        deleted_count = db.query(Tender).filter(Tender.status == TenderStatus.CANCELLED).delete()
        db.commit()
        print(f"Removed {deleted_count} cancelled tenders from database.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_cancelled_tenders()
