"""
Tender Management Router - CRUD operations for tenders/RFPs
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database.connection import get_db
from database.models import Tender, TenderStatus, User, UserRole
from routers.auth import get_current_user, require_role

router = APIRouter()

# Pydantic models
class TenderCreate(BaseModel):
    project_name: str
    department: str
    estimated_budget: float
    description: Optional[str] = None
    closing_date: Optional[datetime] = None

class TenderUpdate(BaseModel):
    project_name: Optional[str] = None
    department: Optional[str] = None
    estimated_budget: Optional[float] = None
    description: Optional[str] = None
    status: Optional[TenderStatus] = None
    closing_date: Optional[datetime] = None

class TenderResponse(BaseModel):
    id: int
    tender_id: str
    project_name: str
    department: str
    estimated_budget: float
    status: str
    description: Optional[str]
    published_date: Optional[datetime]
    closing_date: Optional[datetime]
    created_at: datetime
    ai_validation_score: Optional[float]
    
    class Config:
        from_attributes = True

# Routes
@router.get("/", response_model=List[TenderResponse])
async def get_tenders(
    status: Optional[TenderStatus] = None,
    department: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tenders with optional filtering"""
    query = db.query(Tender)
    
    if status:
        query = query.filter(Tender.status == status)
    if department:
        query = query.filter(Tender.department == department)
    
    tenders = query.offset(skip).limit(limit).all()
    return tenders

@router.get("/{tender_id}", response_model=TenderResponse)
async def get_tender(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific tender by ID"""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return tender

@router.post("/", response_model=TenderResponse)
async def create_tender(
    tender_data: TenderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(
        UserRole.PROCUREMENT_OFFICER,
        UserRole.APPROVING_AUTHORITY
    ))
):
    """Create new tender (Procurement Officer or Approving Authority only)"""
    # Generate tender ID
    year = datetime.now().year
    count = db.query(Tender).filter(
        Tender.tender_id.like(f"TDR-{year}-%")
    ).count()
    tender_id = f"TDR-{year}-{str(count + 1).zfill(3)}"
    
    # Create tender
    new_tender = Tender(
        tender_id=tender_id,
        project_name=tender_data.project_name,
        department=tender_data.department,
        estimated_budget=tender_data.estimated_budget,
        description=tender_data.description,
        closing_date=tender_data.closing_date,
        created_by=current_user.id,
        status=TenderStatus.DRAFT
    )
    
    db.add(new_tender)
    db.commit()
    db.refresh(new_tender)
    
    return new_tender

@router.put("/{tender_id}", response_model=TenderResponse)
async def update_tender(
    tender_id: str,
    tender_data: TenderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(
        UserRole.PROCUREMENT_OFFICER,
        UserRole.APPROVING_AUTHORITY,
        UserRole.EVALUATION_COMMITTEE
    ))
):
    """Update existing tender"""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    # Update fields
    update_data = tender_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tender, field, value)
    
    tender.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tender)
    
    return tender

@router.post("/{tender_id}/publish")
async def publish_tender(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(
        UserRole.PROCUREMENT_OFFICER,
        UserRole.APPROVING_AUTHORITY
    ))
):
    """Publish tender (change status from DRAFT to ACTIVE)"""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    if tender.status != TenderStatus.DRAFT:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot publish tender with status: {tender.status}"
        )
    
    tender.status = TenderStatus.ACTIVE
    tender.published_date = datetime.utcnow()
    tender.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(tender)
    
    return {
        "message": "Tender published successfully",
        "tender_id": tender.tender_id,
        "status": tender.status.value
    }

@router.delete("/{tender_id}")
async def delete_tender(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(
        UserRole.PROCUREMENT_OFFICER,
        UserRole.APPROVING_AUTHORITY
    ))
):
    """Delete tender (Procurement Officer or Approving Authority)"""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    # Hard delete - remove from database entirely
    db.delete(tender)
    db.commit()
    
    return {"message": "Tender deleted successfully", "tender_id": tender_id}

@router.get("/stats/summary")
async def get_tender_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tender statistics for dashboard"""
    active_count = db.query(Tender).filter(Tender.status == TenderStatus.ACTIVE).count()
    evaluation_count = db.query(Tender).filter(Tender.status == TenderStatus.UNDER_EVALUATION).count()
    pending_count = db.query(Tender).filter(Tender.status == TenderStatus.PENDING_APPROVAL).count()
    
    # Count risk alerts (will be implemented in risks router)
    from database.models import RiskAlert
    alerts_count = db.query(RiskAlert).filter(RiskAlert.is_resolved == False).count()
    
    return {
        "activeTenders": active_count,
        "underEvaluation": evaluation_count,
        "pendingApprovals": pending_count,
        "alerts": alerts_count
    }
