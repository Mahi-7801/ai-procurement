"""
Risk & Anomaly Detection Router - AI-powered risk analysis
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database.connection import get_db
from database.models import RiskAlert, Tender, Bid, User, RiskLevel, Vendor
from routers.auth import get_current_user
import pdfplumber
import os
import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path):
    """Utility to extract text from bid documents"""
    if not file_path or not os.path.exists(file_path):
        return ""
    
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages[:10]: # Limit to first 10 pages for performance
                content = page.extract_text()
                if content:
                    text += content + " "
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
    return text.strip()

router = APIRouter()

@router.get("/tender/{tender_id}/alerts")
async def get_tender_risks(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all risk alerts for a specific tender"""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    alerts = db.query(RiskAlert).filter(
        RiskAlert.tender_id == tender.id,
        RiskAlert.is_resolved == False
    ).all()
    
    return [{
        "type": alert.risk_type,
        "level": alert.risk_level.value,
        "message": alert.message,
        "explanation": alert.explanation,
        "detected_at": alert.detected_at
    } for alert in alerts]

@router.get("/all")
async def get_all_risks(
    resolved: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all risk alerts across all tenders"""
    query = db.query(RiskAlert)
    if not resolved:
        query = query.filter(RiskAlert.is_resolved == False)
    
    alerts = query.order_by(RiskAlert.detected_at.desc()).limit(50).all()
    
    result = []
    for alert in alerts:
        tender = db.query(Tender).filter(Tender.id == alert.tender_id).first()
        result.append({
            "id": alert.id,
            "tender_id": tender.tender_id if tender else "Unknown",
            "project_name": tender.project_name if tender else "Unknown",
            "type": alert.risk_type,
            "level": alert.risk_level.value,
            "message": alert.message,
            "explanation": alert.explanation,
            "detected_at": alert.detected_at,
            "is_resolved": alert.is_resolved
        })
    
    return result

@router.post("/tender/{tender_id}/detect")
async def detect_risks(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run AI risk detection on tender bids"""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    bids = db.query(Bid).filter(Bid.tender_id == tender.id).all()
    
    if len(bids) == 0:
        return {"message": "No bids to analyze", "risks_detected": 0}
    
    risks_detected = 0
    
    # Risk 1: Low bid detection
    for bid in bids:
        if bid.financial_bid < tender.estimated_budget * 0.8:
            alert = RiskAlert(
                tender_id=tender.id,
                risk_type="LOW_BID",
                risk_level=RiskLevel.HIGH,
                message=f"Bid {round((1 - bid.financial_bid/tender.estimated_budget) * 100)}% below estimated budget",
                explanation=f"The financial bid is significantly lower than the estimated budget. This may indicate aggressive pricing that could lead to quality compromises or cost escalation during execution.",
                ai_confidence=0.85,
                ai_model_version="1.0.0"
            )
            db.add(alert)
            risks_detected += 1
    
    # Risk 2: Single bid concern
    if len(bids) < 3:
        alert = RiskAlert(
            tender_id=tender.id,
            risk_type="SINGLE_BID",
            risk_level=RiskLevel.MEDIUM,
            message=f"Only {len(bids)} bid(s) received",
            explanation=f"Low participation may indicate restrictive eligibility criteria or market awareness issues.",
            ai_confidence=0.75,
            ai_model_version="1.0.0"
        )
        db.add(alert)
        risks_detected += 1
    
    # Risk 3: Collusion detection (similar pricing)
    if len(bids) >= 2:
        sorted_bids = sorted(bids, key=lambda x: x.financial_bid)
        for i in range(len(sorted_bids) - 1):
            diff_pct = abs(sorted_bids[i].financial_bid - sorted_bids[i+1].financial_bid) / sorted_bids[i].financial_bid
            if diff_pct < 0.05:  # Within 5%
                alert = RiskAlert(
                    tender_id=tender.id,
                    risk_type="COLLUSION",
                    risk_level=RiskLevel.MEDIUM,
                    message="Similar pricing pattern detected",
                    explanation="Multiple bids show pricing patterns within 5% variance, which may suggest coordinated bidding behavior.",
                    ai_confidence=0.70,
                    ai_model_version="1.0.0"
                )
                db.add(alert)
                risks_detected += 1
                break
    
    # Risk 4: Semantic Document Comparison (Plagiarism Detection)
    if len(bids) >= 2:
        bid_texts = []
        valid_bids = []
        
        for bid in bids:
            if bid.technical_document_path:
                text = extract_text_from_pdf(bid.technical_document_path)
                if len(text) > 500: # Significant text needed
                    bid_texts.append(text)
                    valid_bids.append(bid)
        
        if len(bid_texts) >= 2:
            try:
                # Calculate TF-IDF Vectorization
                vectorizer = TfidfVectorizer(stop_words='english')
                tfidf_matrix = vectorizer.fit_transform(bid_texts)
                
                # Compute Cosine Similarity Matrix
                cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
                
                # Check for high similarity pairs (excluding self-similarity)
                for i in range(len(bid_texts)):
                    for j in range(i + 1, len(bid_texts)):
                        similarity = cosine_sim[i][j]
                        if similarity > 0.8: # 80% similarity threshold
                            vendor_i = db.query(Vendor).filter(Vendor.id == valid_bids[i].vendor_id).first()
                            vendor_j = db.query(Vendor).filter(Vendor.id == valid_bids[j].vendor_id).first()
                            
                            alert = RiskAlert(
                                tender_id=tender.id,
                                risk_type="PLAGIARISM",
                                risk_level=RiskLevel.CRITICAL if similarity > 0.95 else RiskLevel.HIGH,
                                message=f"Content similarity ({round(similarity*100)}%) detected between bidders",
                                explanation=f"Technical proposals from '{vendor_i.vendor_name if vendor_i else 'V'+str(valid_bids[i].vendor_id)}' and '{vendor_j.vendor_name if vendor_j else 'V'+str(valid_bids[j].vendor_j)}' show {round(similarity*100)}% semantic overlap. This is a strong indicator of bid rotation or collusion.",
                                ai_confidence=float(similarity),
                                ai_model_version="NLP-Similarity-v1"
                            )
                            db.add(alert)
                            risks_detected += 1
            except Exception as e:
                logger.error(f"Error during semantic analysis: {e}")
    
    db.commit()
    
    return {
        "message": "Risk detection completed",
        "tender_id": tender.tender_id,
        "risks_detected": risks_detected
    }
