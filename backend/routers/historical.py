from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database.connection import HistoricalSessionLocal
from database.models import HistoricalBid, BidType, DataSource
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["Historical Intelligence"])

# Pydantic models for response
class HistoricalBidResponse(BaseModel):
    id: int
    bid_number: Optional[str]
    title: str
    bid_type: BidType
    category: Optional[str]
    keywords: Optional[str]
    ministry: Optional[str]
    department: Optional[str]
    organisation: Optional[str]
    estimated_value: Optional[float]
    emd_amount: Optional[float]
    epbg_percent: Optional[float]
    contract_period: Optional[str]
    validity_days: Optional[int]
    experience_years: Optional[int]
    turnover_percent: Optional[float]
    ld_percent: Optional[float]
    security_deposit: Optional[float]
    standard_clauses: Optional[str]
    pdf_filename: Optional[str]
    data_source: DataSource
    template_data: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True

def get_hist_db():
    db = HistoricalSessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/tenders", response_model=List[HistoricalBidResponse])
async def get_historical_bids(
    category: Optional[str] = None, 
    bid_type: Optional[str] = None,
    db: Session = Depends(get_hist_db)
):
    query = db.query(HistoricalBid)
    if category:
        query = query.filter(HistoricalBid.category == category)
    if bid_type:
        query = query.filter(HistoricalBid.bid_type == bid_type)
    
    return query.all()

@router.get("/search", response_model=List[HistoricalBidResponse])
async def search_historical_bids(query: str, db: Session = Depends(get_hist_db)):
    """Keyword Searching System implementation"""
    keywords = [k.strip().lower() for k in query.split() if len(k) > 2]
    if not keywords:
        return []

    # Get all bids and score them in memory for simple keyword matching
    # In production, this would use full-text search (MATCH/AGAINST)
    bids = db.query(HistoricalBid).all()
    scored_bids = []
    
    for bid in bids:
        score = 0
        bid_keywords = (bid.keywords or "").lower()
        bid_title = bid.title.lower()
        
        for k in keywords:
            if k in bid_keywords:
                score += 2
            if k in bid_title:
                score += 1
                
        if score > 0:
            scored_bids.append((score, bid))
            
    # Sort by score DESC and return top 5
    scored_bids.sort(key=lambda x: x[0], reverse=True)
    return [b[1] for b in scored_bids[:5]]

@router.get("/tenders/{bid_number}", response_model=HistoricalBidResponse)
async def get_historical_bid_by_number(bid_number: str, db: Session = Depends(get_hist_db)):
    bid = db.query(HistoricalBid).filter(HistoricalBid.bid_number == bid_number).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Historical bid not found")
    return bid
