from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
from datetime import datetime

from database.connection import get_db
from database.models import User, UserRole, Tender, Bid, Vendor, RiskAlert, TenderStatus, RiskLevel, Notification, BidStatus
from routers.auth import get_current_user, require_role
import random
import json
import asyncio
import anthropic
import google.generativeai as genai
from groq import Groq
import traceback
from utils.pdf_extractor import extract_text_from_pdf, extract_bid_data_pythonic
from utils.ai_auditor import audit_bid_with_master_prompt

import logging
router = APIRouter()
logger = logging.getLogger(__name__)

# AI extraction is handled by utils/ai_auditor.py (Master Prompt integration)
# PDF extraction is handled by utils/pdf_extractor.py (lightweight, uses pypdf)

async def extract_bid_data_with_ai(tech_path, fin_path, tender_name):
    """Bridge to the AI Auditor Utility"""
    return await audit_bid_with_master_prompt(tech_path, fin_path, tender_name)

@router.post("/audit-preview")
async def audit_bid_preview(
    technical_file: UploadFile = File(...),
    financial_file: UploadFile = File(...),
    tender_name: str = Form("Proposed Project"),
    current_user: User = Depends(get_current_user)
):
    """Run the Master Prompt Auditor as a preview for the vendor"""
    # Save to temp
    temp_dir = "uploads/temp_audit"
    os.makedirs(temp_dir, exist_ok=True)
    
    tech_path = os.path.join(temp_dir, f"audit_tech_{current_user.id}_{technical_file.filename}")
    fin_path = os.path.join(temp_dir, f"audit_fin_{current_user.id}_{financial_file.filename}")
    
    try:
        with open(tech_path, "wb") as buffer:
            shutil.copyfileobj(technical_file.file, buffer)
        with open(fin_path, "wb") as buffer:
            shutil.copyfileobj(financial_file.file, buffer)
            
        results = await extract_bid_data_with_ai(tech_path, fin_path, tender_name)
        
        # Cleanup files if they are fake to save space, but still return details to user
        if results.get("status") == "FAKE":
            try:
                if os.path.exists(tech_path): os.remove(tech_path)
                if os.path.exists(fin_path): os.remove(fin_path)
            except: pass
            
        return results


    finally:
        # Cleanup temp files would be good, but for now we keep them or let OS handle
        pass

# Ensure uploads directory exists
UPLOAD_DIR = "uploads/bids"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/submit")
async def submit_bid(
    tender_id: str = Form(...),
    financial_bid: float = Form(...),
    technical_score: Optional[float] = Form(85.0),
    technical_file: UploadFile = File(...),
    financial_file: UploadFile = File(...),
    submission_duration_ms: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a bid for a tender with actual document uploads"""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    # Get vendor for current user
    vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
    if not vendor:
        # Create a basic vendor record if it doesn't exist
        vendor = Vendor(
            user_id=current_user.id,
            vendor_name=f"{current_user.full_name} Enterprises",
            vendor_code=f"VND-{current_user.id:04d}",
            email=current_user.email
        )
        db.add(vendor)
        db.flush()
        
    # Save files
    tech_filename = f"tech_{tender_id}_{vendor.id}_{technical_file.filename}"
    fin_filename = f"fin_{tender_id}_{vendor.id}_{financial_file.filename}"
    
    tech_path = os.path.join(UPLOAD_DIR, tech_filename).replace("\\", "/")
    fin_path = os.path.join(UPLOAD_DIR, fin_filename).replace("\\", "/")
    
    with open(tech_path, "wb") as buffer:
        shutil.copyfileobj(technical_file.file, buffer)
        
    with open(fin_path, "wb") as buffer:
        shutil.copyfileobj(financial_file.file, buffer)
        
    # --- REAL-TIME AI AUDIT (MASTER PROMPT INTEGRATION) ---
    logger.info(f"Running Real-time AI Audit for bid from vendor {vendor.id} on tender {tender_id}")
    try:
        ai_audit_results = await extract_bid_data_with_ai(tech_path, fin_path, tender.project_name)
    except Exception as e:
        logger.error(f"Real-time AI Audit failed: {e}")
        ai_audit_results = {"status": "UNCERTAIN", "explanation": f"Audit system error: {str(e)}"}

    # --- STRICTOR VALIDATION BLOCK ---
    if ai_audit_results.get("status") == "FAKE":
        logger.warning(f"Blocking submission for vendor {vendor.id}: FAKE DATA DETECTED")
        # Cleanup files if they are fake
        try:
            if os.path.exists(tech_path): os.remove(tech_path)
            if os.path.exists(fin_path): os.remove(fin_path)
        except: pass
        
        raise HTTPException(
            status_code=400, 
            detail="your upload fake data ani"
        )

    # Check if a bid already exists
    existing_bid = db.query(Bid).filter(
        Bid.tender_id == tender.id,
        Bid.vendor_id == vendor.id
    ).first()
    
    if existing_bid:
        existing_bid.financial_bid = financial_bid
        existing_bid.technical_score = ai_audit_results.get("confidence_score", 85.0)
        existing_bid.technical_document_path = tech_path
        existing_bid.financial_document_path = fin_path
        existing_bid.submitted_at = datetime.utcnow()
        existing_bid.status = BidStatus.SUBMITTED
        existing_bid.submission_duration_ms = submission_duration_ms
        existing_bid.ai_analysis = ai_audit_results
    else:
        new_bid = Bid(
            tender_id=tender.id,
            vendor_id=vendor.id,
            financial_bid=financial_bid,
            technical_score=ai_audit_results.get("confidence_score", 85.0),
            technical_document_path=tech_path,
            financial_document_path=fin_path,
            submitted_at=datetime.utcnow(),
            status=BidStatus.SUBMITTED,
            submission_duration_ms=submission_duration_ms,
            ai_analysis=ai_audit_results
        )
        db.add(new_bid)
        
    # 3. RANKING AND ALERTS (Trigger immediate alert if FAKE/SUSPICIOUS)
    if ai_audit_results.get("status") in ["FAKE", "SUSPICIOUS"]:
        new_alert = RiskAlert(
            tender_id=tender.id,
            risk_type="SUBMISSION_AUDIT_FAILURE",
            risk_level=RiskLevel.HIGH if ai_audit_results.get("status") == "FAKE" else RiskLevel.MEDIUM,
            message=f"Pre-Submission Audit Flag: {vendor.vendor_name}",
            explanation=f"AI Auditor flagged this submission as {ai_audit_results.get('status')}. Reason: {ai_audit_results.get('explanation')}",
            is_resolved=False,
            ai_confidence=float(ai_audit_results.get('confidence_score', 0)) / 100
        )
        db.add(new_alert)

    db.commit()
    
    return {
        "status": "success", 
        "message": "Bid submitted and AI-verified successfully", 
        "bid_id": (existing_bid.id if existing_bid else new_bid.id),
        "audit_status": ai_audit_results.get("status"),
        "audit_remarks": ai_audit_results.get("explanation")
    }

@router.post("/bid/{bid_id}/validate")
async def validate_bid(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(
        UserRole.PROCUREMENT_OFFICER,
        UserRole.ADMIN
    ))
):
    """Mark a bid as officially validated by the procurement department"""
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    bid.status = BidStatus.VALIDATED
    bid.updated_at = datetime.utcnow()
    
    # Notify Vendor
    notification = Notification(
        user_id=bid.vendor.user_id,
        title="Bid Validated",
        message=f"Your bid for '{bid.tender.project_name}' has been successfully validated by the procurement department.",
        resource_type="bid",
        resource_id=bid.id
    )
    db.add(notification)
    
    db.commit()
    return {"status": "success", "message": "Bid validated successfully", "bid_status": bid.status}

# Pydantic models
class BidCreate(BaseModel):
    tender_id: int
    vendor_id: int
    financial_bid: float
    technical_score: Optional[float] = None

class BidResponse(BaseModel):
    id: int
    tender_id: int
    vendor_id: int
    vendor_name: str
    financial_bid: float
    technical_score: Optional[float]
    technical_compliance: Optional[float]
    financial_evaluation: Optional[float]
    rank: Optional[str]
    is_l1: bool
    past_performance_risk: Optional[str]
    submitted_at: datetime
    
    # New Scoring Fields
    eligibility_score: Optional[float]
    experience_score: Optional[float]
    specs_score: Optional[float]
    docs_score: Optional[float]
    final_score: Optional[float]
    ai_analysis: Optional[dict]
    status: Optional[BidStatus]
    submission_duration_ms: Optional[int]
    
    class Config:
        from_attributes = True

# Routes
@router.get("/tender/{tender_id}/bids", response_model=List[dict])
async def get_tender_bids(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bids for a specific tender with vendor details"""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    # Filter out drafts for non-officers
    query = db.query(Bid).filter(Bid.tender_id == tender.id)
    # Only restrict for VENDORS - officers/admins should see all bids in this context
    if current_user.role == UserRole.VENDOR:
        query = query.filter(Bid.is_draft == False)
    
    bids = query.all()
    
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
            "status": bid.status.value if hasattr(bid.status, 'value') else bid.status,
            "submissionDurationMs": bid.submission_duration_ms
        })
    
    return result

@router.get("/my-bids", response_model=List[dict])
async def get_my_bids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bids submitted by the current authenticated vendor"""
    if current_user.role in [UserRole.VENDOR]:
        vendor = db.query(Vendor).filter(Vendor.user_id == current_user.id).first()
        if not vendor:
            return []
        bids = db.query(Bid).filter(Bid.vendor_id == vendor.id).all()
    else:
        # Officer/Admin sees all bids
        bids = db.query(Bid).all()

    
    result = []
    for bid in bids:
        tender = db.query(Tender).filter(Tender.id == bid.tender_id).first()
        result.append({
            "id": bid.id,
            "tenderId": tender.tender_id if tender else "Unknown",
            "projectName": tender.project_name if tender else "Unknown",
            "vendorName": bid.vendor.vendor_name if bid.vendor else "Unknown",
            "technicalScore": bid.technical_score or 0,
            "financialBid": bid.financial_bid,
            "rank": bid.rank or "N/A",
            "technicalCompliance": bid.technical_compliance or 0,
            "financialEvaluation": bid.financial_evaluation or 0,
            "pastPerformanceRisk": bid.past_performance_risk.value if bid.past_performance_risk else "Low",
            "isL1": bid.is_l1,
            "isDraft": bid.is_draft,
            "status": bid.status.value if bid.status else "SUBMITTED",
            "technicalDocumentPath": bid.technical_document_path,
            "financialDocumentPath": bid.financial_document_path,
            "eligibilityScore": bid.eligibility_score,
            "experienceScore": bid.experience_score,
            "specsScore": bid.specs_score,
            "docsScore": bid.docs_score,
            "finalScore": bid.final_score,
            "aiAnalysis": bid.ai_analysis,
            "submissionDurationMs": bid.submission_duration_ms,
            "submittedAt": bid.submitted_at.isoformat() if bid.submitted_at else None
        })
    
    return result

@router.post("/tender/{tender_id}/evaluate")
@router.post("/tender/{tender_id}/run-comparative-ai")
async def evaluate_bids(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(
        UserRole.EVALUATION_COMMITTEE,
        UserRole.PROCUREMENT_OFFICER,
        UserRole.ADMIN
    ))
):
    """
    AI-powered multi-stage comparative evaluation.
    1. Document Validation
    2. Technical Evaluation (Qualified/Disqualified)
    3. Financial Evaluation (Ranking L1, L2...)
    4. Decision & Notifications
    """
    # Fetch tender and bids
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    bids = db.query(Bid).filter(Bid.tender_id == tender.id).all()
    if not bids:
        raise HTTPException(status_code=400, detail="No bids found for this tender.")

    try:
        results_list = []
        qualified_bids = []

        # Hierarchy as requested
        officer_hierarchy = [
            "Kali - 1st Officer (Final Authority)",
            "Mahi - 2nd Officer",
            "Bujji - 3rd Officer",
            "Vijay - 4th Officer"
        ]

        # Parallel AI Audit Execution
        logger.info(f"Triggering parallel AI audit for {len(bids)} bids on tender {tender_id}")

        async def get_bid_audit(bid_obj):
            v_name = bid_obj.vendor.vendor_name if bid_obj.vendor else "Unknown Vendor"
            a_data = bid_obj.ai_analysis
            if not a_data:
                try:
                    a_data = await audit_bid_with_master_prompt(
                        bid_obj.technical_document_path, 
                        bid_obj.financial_document_path, 
                        tender.project_name
                    )
                    bid_obj.ai_analysis = a_data
                except Exception as e:
                    logger.error(f"Parallel AI Audit failed: {e}")
                    a_data = {"status": "UNCERTAIN", "explanation": f"Audit error: {str(e)}"}
            return bid_obj, a_data

        audit_results = await asyncio.gather(*[get_bid_audit(b) for b in bids])

        for bid, ai_data in audit_results:
            vendor_name = bid.vendor.vendor_name if bid.vendor else "Unknown Vendor"
            
            # 2. EVALUATION LOGIC
            issues = []
            is_qualified = True
            
            # Safely handle documents_present
            docs = ai_data.get("documents_present", {})
            if not isinstance(docs, dict): docs = {}
            
            missing_docs = [doc for doc, present in docs.items() if not present]
            if missing_docs:
                is_qualified = False
                issues.append(f"Missing Documents: {', '.join(missing_docs)}")
            
            # Check technical status from AI
            status = ai_data.get("status", "VALID")
            if status in ["FAKE", "SUSPICIOUS"]:
                is_qualified = False
                issues.append(f"AI Audit Flag: {status}")
                
            # Technical Score (for existing UI compatibility)
            conf_score = ai_data.get("confidence_score")
            try:
                bid.technical_score = float(conf_score) if conf_score is not None else 85.0
            except (ValueError, TypeError):
                bid.technical_score = 85.0

            if is_qualified:
                qualified_bids.append(bid)
            else:
                bid.technical_score = 0.0
                
            bid.status = BidStatus.EVALUATED
            bid.technical_compliance = 100.0 if is_qualified else 0.0
            
            results_list.append({
                "vendor_id": bid.id,
                "vendor_name": vendor_name,
                "status": "Qualified" if is_qualified else "Disqualified",
                "rank": "N/A",
                "price": bid.financial_bid or 0.0,
                "issues": issues,
                "final_decision": "Pending",
                "reason": ai_data.get("explanation", "Meets technical requirements.") if is_qualified else f"Disqualified: {', '.join(issues)}"
            })

        # 3. RANKING (Only for qualified bids)
        if qualified_bids:
            qualified_bids.sort(key=lambda x: x.financial_bid or 9999999999.0)
        
            for idx, bid in enumerate(qualified_bids):
                rank_label = f"L{idx + 1}"
                bid.rank = rank_label
                bid.is_l1 = (idx == 0)
                
                # Update results_list
                for res in results_list:
                    if res["vendor_id"] == bid.id:
                        res["rank"] = rank_label
                        if idx == 0:
                            res["final_decision"] = "Selected"
                            res["reason"] = f"Winner of the tender as L1 bidder with lowest price of Rs.{bid.financial_bid:,.2f}."
                        else:
                            res["final_decision"] = "Rejected"
                            res["reason"] = f"Mathematically L{idx+1}. Price is higher than L1 winner."

        # Handle disqualified vendors in results_list
        for res in results_list:
            if res["status"] == "Disqualified":
                res["rank"] = "DQ"
                res["final_decision"] = "Rejected"

        # 4. SANITIZE & STORE RESULTS & SEND NOTIFICATIONS
        def clean_text(text: str) -> str:
            if not text: return ""
            # Replaces common symbols and strips any other non-ASCII to be DB safe
            cleaned = text.replace("₹", "Rs.").replace("\u20b9", "Rs.")
            return cleaned.encode('ascii', 'ignore').decode('ascii')

        winner_vendor = None
        winner_justification = ""

        # Pre-clean all results
        for res in results_list:
            res["reason"] = clean_text(res["reason"])
            res["vendor_name"] = clean_text(res["vendor_name"])

        for res in results_list:
            bid_id = res["vendor_id"]
            bid_obj = db.query(Bid).filter(Bid.id == bid_id).first()
            if not bid_obj or not bid_obj.vendor:
                continue
                
            # Notification Logic
            if res["final_decision"] == "Selected":
                winner_vendor = res["vendor_name"]
                winner_justification = res["reason"]
                
                if bid_obj.vendor.user_id:
                    notification = Notification(
                        user_id=bid_obj.vendor.user_id,
                        title="Tender Selection: WINNER (L1)",
                        message=f"Congratulations! Your bid for '{tender.project_name}' has been selected as L1. {res['reason']}",
                        resource_type="bid",
                        resource_id=bid_id
                    )
                    db.add(notification)
            else:
                if bid_obj.vendor.user_id:
                    notification = Notification(
                        user_id=bid_obj.vendor.user_id,
                        title="Tender Evaluation Result",
                        message=f"Regarding tender '{tender.project_name}': Your bid was rejected. Reason: {res['reason']}",
                        resource_type="bid",
                        resource_id=bid_id
                    )
                    db.add(notification)

        # Clean up results_list for JSON output (remove vendor_id)
        final_results = []
        for r in results_list:
            final_results.append({
                "vendor_name": r["vendor_name"],
                "status": r["status"],
                "rank": r["rank"],
                "price": f"Rs.{r['price']:,.2f}" if r['price'] else "N/A",
                "issues": r["issues"],
                "final_decision": r["final_decision"],
                "reason": r["reason"]
            })

        tender.status = TenderStatus.UNDER_EVALUATION
        db.commit()
    except Exception as inner_e:
        logger.error(f"CRITICAL EVALUATION ERROR: {str(inner_e)}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"AI Evaluation Engine Error: {str(inner_e)}")

    return {
        "officer_hierarchy": officer_hierarchy,
        "results": final_results,
        "winner": {
            "vendor_name": winner_vendor or "None",
            "rank": "L1",
            "justification": winner_justification or "No qualified bidders found."
        }
    }

@router.post("/tender/{tender_id}/award")
async def award_tender(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(
        UserRole.PROCUREMENT_OFFICER,
        UserRole.ADMIN,
        UserRole.APPROVING_AUTHORITY
    ))
):
    """Finalize the tender award and notify all participating vendors."""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    bids = db.query(Bid).filter(Bid.tender_id == tender.id).all()
    if not bids:
        raise HTTPException(status_code=400, detail="Cannot award a tender with no bids.")
        
    # Check if evaluation has been run (L1 exists)
    l1_bid = db.query(Bid).filter(Bid.tender_id == tender.id, Bid.is_l1 == True).first()
    if not l1_bid:
        raise HTTPException(status_code=400, detail="Comparative evaluation must be run before awarding.")

    # Update tender status
    tender.status = TenderStatus.CLOSED
    tender.updated_at = datetime.utcnow()
    
    # Final notifications for all vendors
    for bid in bids:
        if not bid.vendor or not bid.vendor.user_id:
            continue
            
        if bid.is_l1:
            title = "OFFICIAL AWARD NOTIFICATION"
            msg = f"Official Letter of Award: You have been awarded the contract for '{tender.project_name}'. Status: CLOSED/AWARDED."
        else:
            title = "Tender Closed: Final Outcome"
            msg = f"The procurement process for '{tender.project_name}' has been finalized. Your bid was not selected. Status: CLOSED."
            
        notification = Notification(
            user_id=bid.vendor.user_id,
            title=title,
            message=msg,
            resource_type="tender",
            resource_id=tender.id
        )
        db.add(notification)
        
    db.commit()
    
    return {
        "status": "success",
        "message": f"Tender {tender_id} successfully awarded and closed.",
        "winner": l1_bid.vendor.vendor_name if l1_bid.vendor else "Unknown"
    }

@router.get("/tender/{tender_id}/comparison")
async def get_bid_comparison(
    tender_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get bid comparison data for charts"""
    tender = db.query(Tender).filter(Tender.tender_id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    bids = db.query(Bid).filter(Bid.tender_id == tender.id).limit(5).all()
    
    vendors = []
    technical_scores = []
    financial_bids = []
    
    for bid in bids:
        vendor = db.query(Vendor).filter(Vendor.id == bid.vendor_id).first()
        vendors.append(vendor.vendor_name[:20] if vendor else "Unknown")
        technical_scores.append(bid.technical_score or 0)
        financial_bids.append(bid.financial_bid / 100000)  # Convert to lakhs
    
    return {
        "vendors": vendors,
        "technicalScores": technical_scores,
        "financialBids": financial_bids
    }

@router.post("/bid/{bid_id}/evaluate")
async def evaluate_single_bid(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Re-run extraction and scoring for a single bid"""
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    tender = bid.tender
    
    # 1. Extract raw text
    tech_text = extract_text_from_pdf(bid.technical_document_path, max_chars=10000)
    fin_text = extract_text_from_pdf(bid.financial_document_path, max_chars=5000)

    # 2. Extract structured data using Python logic
    data = extract_bid_data_pythonic(tech_text, fin_text, tender.project_name)
    
    # Log extraction
    bid.ai_analysis = data
    
    # Calculate scores (reuse logic from main evaluate loop)
    tech_total = 0
    
    # Eligibility
    elig_score = 0
    if data.get("gst_found"): elig_score += 5
    if data.get("experience_years", 0) >= 3: elig_score += 5
    if (data.get("turnover_cr", 0) * 10000000) >= (tender.estimated_budget * 0.25): elig_score += 5
    if data.get("certifications"): elig_score += 5
    bid.eligibility_score = float(elig_score)
    tech_total += elig_score
    
    # Experience
    exp_score = min(data.get("projects_count", 0) * 3, 15)
    bid.experience_score = float(exp_score)
    tech_total += exp_score
    
    # Specs
    specs = data.get("specs_compliance", [])
    if specs:
        compliant_specs = len([s for s in specs if s.get("compliant")])
        specs_score = round((compliant_specs / len(specs)) * 20, 2)
    else:
        specs_score = 20.0 
    bid.specs_score = float(specs_score)
    tech_total += specs_score
    
    # Docs
    docs = data.get("documents_present", {})
    if docs:
        attached_docs = len([v for v in docs.values() if v])
        docs_score = round((attached_docs / len(docs)) * 15, 2)
    else:
        docs_score = 15.0
    bid.docs_score = float(docs_score)
    tech_total += docs_score
    
    bid.technical_score = float(tech_total)
    bid.technical_compliance = float(tech_total)
    
    # Final Score needs financial comparison, which requires all bids
    all_bids = db.query(Bid).filter(Bid.tender_id == tender.id).all()
    if all_bids:
        lowest_price = min(b.financial_bid for b in all_bids)
        if bid.financial_bid > 0:
            bid.financial_evaluation = round((lowest_price / bid.financial_bid) * 30, 2)
        bid.final_score = bid.technical_score + (bid.financial_evaluation or 0)
        
    db.commit()
    return {"status": "success", "bid_id": bid_id, "new_score": bid.final_score}

@router.post("/bid/{bid_id}/reset")
async def reset_bid_evaluation(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear all evaluation metrics for a bid"""
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    # Keep scores for reference, but clear rank to allow re-evaluation
    # bid.technical_score = 0.0
    # bid.technical_compliance = 0.0
    # bid.eligibility_score = 0.0
    # bid.experience_score = 0.0
    # bid.specs_score = 0.0
    # bid.docs_score = 0.0
    # bid.financial_evaluation = 0.0
    # bid.final_score = 0.0
    # bid.ai_analysis = None
    
    bid.rank = None
    bid.is_l1 = False
    
    db.commit()
    
    # Notify Vendor
    if bid.vendor and bid.vendor.user_id:
        notification = Notification(
            user_id=bid.vendor.user_id,
            title="Evaluation Reset",
            message=f"The evaluation for your bid on tender '{bid.tender.project_name}' has been reset by the procurement officer. Your bid may be re-evaluated shortly.",
            resource_type="bid",
            resource_id=bid.id
        )
        db.add(notification)
        db.commit()
        
    return {"status": "success", "message": "Evaluation reset and vendor notified"}

@router.delete("/bid/{bid_id}")
async def delete_bid(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a bid submission and notify vendor"""
    logger.info(f"DELETE /bid/{bid_id} request from {current_user.email} (Role: {current_user.role})")
    try:
        # Check if officer or admin
        if current_user.role not in [UserRole.PROCUREMENT_OFFICER, UserRole.ADMIN]:
            logger.warning(f"Unauthorized bid delete attempt by {current_user.email}")
            raise HTTPException(status_code=403, detail="Not authorized to delete bids")
            
        # Standard lookup
        bid = db.query(Bid).filter(Bid.id == bid_id).first()
            
        if not bid:
            logger.error(f"Bid ID {bid_id} not found in database.")
            raise HTTPException(status_code=404, detail=f"Bid record {bid_id} not found or already deleted")
            
        vendor_user_id = bid.vendor.user_id if bid.vendor else None
        tender_name = bid.tender.project_name if bid.tender else "Tender"
        tender_id = bid.tender_id
        
        # Notify Vendor first while we have data
        if vendor_user_id:
            try:
                notification = Notification(
                    user_id=vendor_user_id,
                    title="Bid Submission Removed",
                    message=f"Your bid for '{tender_name}' has been deleted by the procurement officer. This action is final.",
                    resource_type="tender",
                    resource_id=tender_id
                )
                db.add(notification)
                logger.info(f"Notification added for vendor of bid {bid_id}")
            except Exception as e:
                logger.error(f"Failed to create notification for delete: {e}")
            
        # Perform deletion
        db.delete(bid)
        db.commit()
        logger.info(f"Successfully deleted bid {bid_id}")
        
        return {"status": "success", "message": "Bid deleted and vendor notified successfully"}
    except HTTPException as h:
        raise h
    except Exception as e:
        logger.error(f"CRITICAL ERROR deleting bid {bid_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete bid: {str(e)}")

@router.get("/bid/{bid_id}/download/{file_type}")
async def download_bid_document(
    bid_id: int,
    file_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.PROCUREMENT_OFFICER, UserRole.ADMIN))
):
    """Securely download a vendor's bid document"""
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    if file_type not in ["technical", "financial"]:
        raise HTTPException(status_code=400, detail="Invalid file type requested.")
        
    file_path = bid.technical_document_path if file_type == "technical" else bid.financial_document_path
    
    if not file_path or not os.path.exists(file_path):
        # Fallback for mock data / legacy records that lack real files
        logger.warning(f"File {file_path} not found. Generating mock file for bid {bid_id}.")
        temp_dir = "uploads/bids/temp"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"mock_recovery_{bid_id}_{file_type}.txt")
        with open(temp_path, "w") as f:
            f.write(f"Recovery Document: {file_type.capitalize()} Bid\n")
            f.write(f"The original file at '{file_path}' could not be located on the server.\nThis is a temporary fallback document.")
            
        return FileResponse(
            path=temp_path,
            filename=f"Recovered_{file_type}_{bid_id}.txt",
            media_type="text/plain" 
        )
        
    filename = os.path.basename(file_path)
    
    # Determine media type based on file extension
    media_type = "application/octet-stream"
    if filename.lower().endswith(".pdf"):
        media_type = "application/pdf"
    elif filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        media_type = "image/png" if ".png" in filename.lower() else "image/jpeg"
    elif filename.lower().endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type,
        content_disposition_type="attachment"
    )

