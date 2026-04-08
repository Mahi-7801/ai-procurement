
import os
from database.connection import SessionLocal
from database.models import Bid, Vendor, Tender

def check_bids():
    db = SessionLocal()
    tender = db.query(Tender).filter(Tender.project_name.like('%Laptop%')).first()
    bids = db.query(Bid).filter(Bid.tender_id == tender.id).all()
    
    result = []
    for bid in bids:
        vendor = db.query(Vendor).filter(Vendor.id == bid.vendor_id).first()
        result.append({
            "id": bid.id,
            "vendorName": vendor.vendor_name if vendor else "Unknown",
            "technicalScore": bid.technical_score or 0,
            "financialBid": bid.financial_bid,
            "rank": bid.rank or "N/A",
            "technicalCompliance": bid.technical_compliance or 0,
            "financialEvaluation": bid.financial_evaluation or 0,
            "pastPerformanceRisk": bid.past_performance_risk.value if bid.past_performance_risk else "Low",
            "isL1": bid.is_l1,
            "isDraft": bid.is_draft,
            "technicalDocumentPath": bid.technical_document_path,
            "financialDocumentPath": bid.financial_document_path,
            "eligibilityScore": bid.eligibility_score,
            "experienceScore": bid.experience_score,
            "specsScore": bid.specs_score,
            "docsScore": bid.docs_score,
            "finalScore": bid.final_score,
            "aiAnalysis": bid.ai_analysis,
            "status": bid.status,
            "submissionDurationMs": bid.submission_duration_ms
        })
    print(result)

if __name__ == "__main__":
    check_bids()
