"""Reports Router - Generate evaluation and audit reports"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User, AuditLog, Tender
from routers.auth import get_current_user
from typing import List

router = APIRouter()

@router.get("/")
async def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": "Reports endpoint - under development"}

@router.get("/audit")
async def get_global_audit_logs(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Retrieve the most recent audit logs across the whole system"""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()

    return [
        {
            "id": log.id,
            "action": log.action,
            "timestamp": log.timestamp.isoformat(),
            "user": log.user.full_name if log.user else "System",
            "method": log.method,
            "status_code": log.status_code,
            "ip": log.ip_address
        }
        for log in logs
    ]

@router.get("/audit/{tender_id}")
async def get_audit_logs(
    tender_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Retrieve all audit logs related to a specific tender"""
    # 1. Map tender_id (string like TDR-001) to internal integer ID
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        # Fallback to direct ID if not found by string
        try:
            t_id = int(tender_id)
            tender = db.query(Tender).filter(Tender.id == t_id).first()
        except:
            pass
            
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    # 2. Fetch logs for this tender with flexible matching
    from sqlalchemy import or_
    
    logs = db.query(AuditLog).filter(
        or_(
            AuditLog.resource_id == tender.id,
            AuditLog.endpoint.like(f"%{tender.id}%"),
            AuditLog.endpoint.like(f"%{(tender.tender_id)}%")
        )
    ).order_by(AuditLog.timestamp.desc()).all()

    return [
        {
            "id": log.id,
            "action": log.action,
            "timestamp": log.timestamp.isoformat(),
            "user": log.user.full_name if log.user else "System",
            "method": log.method,
            "status_code": log.status_code,
            "ip": log.ip_address
        }
        for log in logs
    ]

@router.post("/generate/{tender_id}")
async def generate_report(tender_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": f"Report generation for {tender_id} - under development"}
