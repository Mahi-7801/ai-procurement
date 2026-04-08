"""
Communication Management Router - Role-based message routing
Automatic routing based on tender stage and user roles
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database.connection import get_db
from database.models import User, Tender, UserRole
from database.communication_models import (
    Communication, CommunicationType, WorkflowStage, 
    MessageStatus, CommunicationThread, RoutingRule
)
from routers.auth import get_current_user, require_role
import os
import anthropic
import google.generativeai as genai
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Configure AI Clients
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

claude_client = None
if ANTHROPIC_API_KEY and "ENTER_YOUR" not in ANTHROPIC_API_KEY:
    try:
        claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Anthropic client: {e}")

gemini_model = None
if GEMINI_API_KEY and "ENTER_YOUR" not in GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-1.5-pro')
    except Exception as e:
        logger.error(f"Failed to initialize Gemini client: {e}")

# Pydantic models
class SendMessageRequest(BaseModel):
    tender_id: int
    communication_type: CommunicationType
    subject: str
    message: str
    attachments: Optional[List[str]] = None
    requires_action: bool = False
    to_role: Optional[str] = "SYSTEM_ROUTED"

class MessageResponse(BaseModel):
    id: int
    tender_id: int
    tender_ref: str
    communication_type: str
    from_user: str
    from_role: str
    to_role: str
    subject: str
    message: str
    status: str
    sent_at: datetime
    read_at: Optional[datetime]
    requires_action: bool
    action_taken: bool
    
    class Config:
        from_attributes = True

class ThreadResponse(BaseModel):
    id: int
    tender_id: int
    thread_subject: str
    message_count: int
    is_resolved: bool
    last_message_at: datetime

# Role-based routing configuration
# Role-based routing configuration (Stage, Type, FromRole) -> ToRole
ROUTING_MATRIX = {
    # Pre-RFP Stage
    (WorkflowStage.PRE_RFP, CommunicationType.CLARIFICATION_REQUEST, "PROCUREMENT_OFFICER"): "EVALUATION_COMMITTEE",
    (WorkflowStage.PRE_RFP, CommunicationType.VENDOR_NOTICE, "PROCUREMENT_OFFICER"): "VENDOR",
    (WorkflowStage.PRE_RFP, CommunicationType.QUERY, "PROCUREMENT_OFFICER"): "VENDOR",
    
    # RFP Published Stage
    (WorkflowStage.RFP_PUBLISHED, CommunicationType.TENDER_INTIMATION, "PROCUREMENT_OFFICER"): "VENDOR",
    (WorkflowStage.RFP_PUBLISHED, CommunicationType.VENDOR_NOTICE, "PROCUREMENT_OFFICER"): "VENDOR",
    (WorkflowStage.RFP_PUBLISHED, CommunicationType.QUERY, "VENDOR"): "PROCUREMENT_OFFICER",
    
    # Evaluation Stage
    (WorkflowStage.EVALUATION, CommunicationType.EVALUATION_REQUEST, "PROCUREMENT_OFFICER"): "EVALUATION_COMMITTEE",
    (WorkflowStage.EVALUATION, CommunicationType.EVALUATION_REPORT, "EVALUATION_COMMITTEE"): "PROCUREMENT_OFFICER",
    (WorkflowStage.EVALUATION, CommunicationType.COMPLIANCE_REMARK, "EVALUATION_COMMITTEE"): "PROCUREMENT_OFFICER",
    (WorkflowStage.EVALUATION, CommunicationType.VENDOR_NOTICE, "PROCUREMENT_OFFICER"): "VENDOR",
    (WorkflowStage.EVALUATION, CommunicationType.CLARIFICATION_REQUEST, "PROCUREMENT_OFFICER"): "VENDOR",
    (WorkflowStage.EVALUATION, CommunicationType.CLARIFICATION_REQUEST, "VENDOR"): "PROCUREMENT_OFFICER",
    (WorkflowStage.EVALUATION, CommunicationType.CLARIFICATION_RESPONSE, "VENDOR"): "PROCUREMENT_OFFICER",
    (WorkflowStage.EVALUATION, CommunicationType.CLARIFICATION_RESPONSE, "PROCUREMENT_OFFICER"): "VENDOR",
    (WorkflowStage.EVALUATION, CommunicationType.QUERY, "VENDOR"): "PROCUREMENT_OFFICER",
    
    # Approval Stage
    (WorkflowStage.APPROVAL, CommunicationType.APPROVAL_REQUEST, "PROCUREMENT_OFFICER"): "APPROVING_AUTHORITY",
    (WorkflowStage.APPROVAL, CommunicationType.APPROVAL_DECISION, "APPROVING_AUTHORITY"): "PROCUREMENT_OFFICER",
    (WorkflowStage.APPROVAL, CommunicationType.REJECTION_DECISION, "APPROVING_AUTHORITY"): "PROCUREMENT_OFFICER",
    (WorkflowStage.APPROVAL, CommunicationType.QUERY, "APPROVING_AUTHORITY"): "PROCUREMENT_OFFICER",
    
    # Post-Approval Stage
    (WorkflowStage.POST_APPROVAL, CommunicationType.AUDIT_OBSERVATION, "RTGS_AUDITOR"): "APPROVING_AUTHORITY",
    (WorkflowStage.POST_APPROVAL, CommunicationType.COMPLIANCE_NOTICE, "RTGS_AUDITOR"): "PROCUREMENT_OFFICER",
    
    # Bid Submission Stage
    (WorkflowStage.BID_SUBMISSION, CommunicationType.CLARIFICATION_RESPONSE, "VENDOR"): "PROCUREMENT_OFFICER",
    (WorkflowStage.BID_SUBMISSION, CommunicationType.VENDOR_NOTICE, "PROCUREMENT_OFFICER"): "VENDOR",
    (WorkflowStage.BID_SUBMISSION, CommunicationType.CLARIFICATION_REQUEST, "VENDOR"): "PROCUREMENT_OFFICER",
}

def get_role_string(role) -> str:
    """Safely convert UserRole enum or string to its base string value"""
    if hasattr(role, 'value'):
        return role.value
    if hasattr(role, 'name'):
        return role.name
    return str(role).split('.')[-1] # Handle 'UserRole.VENDOR' -> 'VENDOR'

def get_routing_target(
    workflow_stage: WorkflowStage,
    communication_type: CommunicationType,
    from_role: UserRole
) -> str:
    """
    Determine target role based on workflow stage, communication type and sender role
    Returns the role that should receive the message
    """
    sender_role_str = get_role_string(from_role)
    routing_key = (workflow_stage, communication_type, sender_role_str)
    
    # 1. Check strict routing matrix
    if routing_key in ROUTING_MATRIX:
        return ROUTING_MATRIX[routing_key]
    
    # 2. Dynamic fallbacks for flexible communication
    
    # Vendors always talk to Procurement Officers
    if sender_role_str == "VENDOR":
        return "PROCUREMENT_OFFICER"
        
    # Procurement Officers can talk to Vendors or Approvers depending on intent
    if sender_role_str == "PROCUREMENT_OFFICER":
        if "VENDOR" in str(communication_type) or communication_type in [CommunicationType.VENDOR_NOTICE, CommunicationType.CLARIFICATION_REQUEST, CommunicationType.TENDER_INTIMATION]:
            return "VENDOR"
        return "APPROVING_AUTHORITY"
    
    # Evaluation Committee talks back to Officer
    if sender_role_str == "EVALUATION_COMMITTEE":
        return "PROCUREMENT_OFFICER"
        
    # Approvers talk back to Officer
    if sender_role_str == "APPROVING_AUTHORITY":
        return "PROCUREMENT_OFFICER"
        
    # Auditors talk to Approvers or Officers
    if sender_role_str == "RTGS_AUDITOR":
        if communication_type == CommunicationType.AUDIT_OBSERVATION:
            return "APPROVING_AUTHORITY"
        return "PROCUREMENT_OFFICER"

    return "PROCUREMENT_OFFICER" # Ultimate fallback

    raise HTTPException(
        status_code=400,
        detail=f"No routing rule found for {sender_role_str} sending {communication_type.value} at stage {workflow_stage.value}"
    )

def assign_recipient(to_role: str, db: Session) -> Optional[int]:
    """
    Assign a specific user from the target role
    For now, assigns to first active user with that role
    In production, use load balancing or assignment rules
    """
    user = db.query(User).filter(
        User.role == to_role,
        User.is_active == True
    ).first()
    
    return user.id if user else None

# Routes
@router.post("/send", response_model=dict)
async def send_message(
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message with automatic role-based routing
    System determines recipient based on tender stage and message type
    """
    # Get tender and determine workflow stage
    tender = db.query(Tender).filter(Tender.id == request.tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    # Map tender status to workflow stage (Case-insensitive)
    workflow_stage = WorkflowStage.EVALUATION  # Default
    status_map = {
        "DRAFT": WorkflowStage.PRE_RFP,
        "DRAFT_TENDER": WorkflowStage.PRE_RFP,
        "ACTIVE": WorkflowStage.RFP_PUBLISHED,
        "PUBLISHED": WorkflowStage.RFP_PUBLISHED,
        "UNDER_EVALUATION": WorkflowStage.EVALUATION,
        "EVALUATION": WorkflowStage.EVALUATION,
        "PENDING_APPROVAL": WorkflowStage.APPROVAL,
        "APPROVAL": WorkflowStage.APPROVAL,
        "APPROVED": WorkflowStage.POST_APPROVAL,
        "POST_APPROVAL": WorkflowStage.POST_APPROVAL,
        "AWARDED": WorkflowStage.POST_APPROVAL,
        "CLOSED": WorkflowStage.POST_APPROVAL,
        # Sentence case fallbacks
        "Draft": WorkflowStage.PRE_RFP,
        "Active": WorkflowStage.RFP_PUBLISHED,
        "Under Evaluation": WorkflowStage.EVALUATION,
        "Pending Approval": WorkflowStage.APPROVAL,
        "Approved": WorkflowStage.POST_APPROVAL
    }
    
    raw_status = tender.status if isinstance(tender.status, str) else tender.status.value
    current_status = raw_status.upper() if raw_status else "UNKNOWN"
    workflow_stage = status_map.get(current_status, status_map.get(raw_status, WorkflowStage.EVALUATION))
    
    logger.info(f"Routing message from {current_user.username} ({current_user.role.value}) for tender {tender.tender_id} (Status: {current_status} -> Stage: {workflow_stage.value})")

    
    # Determine target role using routing matrix or manual selection
    if request.to_role and request.to_role != "SYSTEM_ROUTED":
        to_role = request.to_role
        logger.info(f"Manual routing requested to role: {to_role}")
    else:
        try:
            to_role = get_routing_target(
                workflow_stage,
                request.communication_type,
                current_user.role
            )
            logger.info(f"Target role determined by system: {to_role}")
        except HTTPException as e:
            logger.error(f"Routing failed: {e.detail}")
            raise e

    
    # Assign specific recipient from target role
    to_user_id = assign_recipient(to_role, db)
    logger.info(f"Recipient assigned: user_id={to_user_id} (Role: {to_role})")

    
    # Create communication record
    communication = Communication(
        tender_id=request.tender_id,
        workflow_stage=workflow_stage,
        communication_type=request.communication_type,
        from_user_id=current_user.id,
        from_role=current_user.role.value,
        to_role=to_role,
        to_user_id=to_user_id,
        subject=request.subject,
        message=request.message,
        attachments=request.attachments,
        requires_action=request.requires_action,
        auto_routed=True,
        status=MessageStatus.SENT
    )
    
    db.add(communication)
    db.commit()
    db.refresh(communication)
    
    logger.info(f"Communication {communication.id} created and routed to {to_role}")
    
    return {
        "message": "Communication sent successfully",
        "communication_id": communication.id,
        "routed_to_role": to_role,
        "routed_to_user": to_user_id,
        "workflow_stage": workflow_stage.value
    }

@router.get("/inbox", response_model=List[dict])
async def get_inbox(
    unread_only: bool = False,
    requires_action: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get messages for current user's role
    Role-based inbox - shows messages routed to user's role
    """
    # Use role value (e.g., "VENDOR", "PROCUREMENT_OFFICER")
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    
    logger.info(f"Fetching inbox for user {current_user.username} with role {user_role}")
    
    query = db.query(Communication).filter(
        Communication.to_role == user_role
    )

    
    if unread_only:
        query = query.filter(Communication.read_at == None)
    
    if requires_action:
        query = query.filter(
            Communication.requires_action == True,
            Communication.action_taken == False
        )
    
    messages = query.order_by(Communication.sent_at.desc()).limit(50).all()
    
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.from_user_id).first()
        tender = db.query(Tender).filter(Tender.id == msg.tender_id).first()
        
        result.append({
            "id": msg.id,
            "tender_id": msg.tender_id,
            "tender_ref": tender.tender_id if tender else "Unknown",
            "communication_type": msg.communication_type.value,
            "from_user": sender.full_name if sender else "System",
            "from_role": msg.from_role,
            "subject": msg.subject,
            "message": msg.message,
            "status": msg.status.value,
            "sent_at": msg.sent_at,
            "read_at": msg.read_at,
            "requires_action": msg.requires_action,
            "action_taken": msg.action_taken,
            "priority": msg.priority
        })
    
    return result

@router.get("/sent", response_model=List[dict])
async def get_sent_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages sent by current user"""
    messages = db.query(Communication).filter(
        Communication.from_user_id == current_user.id
    ).order_by(Communication.sent_at.desc()).limit(50).all()
    
    result = []
    for msg in messages:
        tender = db.query(Tender).filter(Tender.id == msg.tender_id).first()
        result.append({
            "id": msg.id,
            "tender_id": msg.tender_id,
            "tender_ref": tender.tender_id if tender else "Unknown",
            "communication_type": msg.communication_type.value,
            "to_role": msg.to_role,
            "subject": msg.subject,
            "status": msg.status.value,
            "sent_at": msg.sent_at,
            "delivered_at": msg.delivered_at,
            "read_at": msg.read_at
        })
    
    return result

@router.post("/{message_id}/mark-read")
async def mark_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark message as read"""
    message = db.query(Communication).filter(Communication.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.to_role != current_user.role.value:
        raise HTTPException(status_code=403, detail="Not authorized to read this message")
    
    message.status = MessageStatus.READ
    message.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Marked as read"}

@router.post("/{message_id}/acknowledge")
async def acknowledge_message(
    message_id: int,
    action_details: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acknowledge message and optionally record action taken"""
    message = db.query(Communication).filter(Communication.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message.to_role != current_user.role.value:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message.status = MessageStatus.ACKNOWLEDGED
    message.acknowledged_at = datetime.utcnow()
    
    if action_details:
        message.action_taken = True
        message.action_details = action_details
        message.status = MessageStatus.ACTION_TAKEN
    
    db.commit()
    
    return {"message": "Message acknowledged"}

@router.get("/tender/{tender_id}/thread")
async def get_tender_thread(
    tender_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all communications for a specific tender (conversation thread)"""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    messages = db.query(Communication).filter(
        Communication.tender_id == tender_id
    ).order_by(Communication.sent_at.asc()).all()
    
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.from_user_id).first()
        result.append({
            "id": msg.id,
            "communication_type": msg.communication_type.value,
            "from_user": sender.full_name if sender else "System",
            "from_role": msg.from_role,
            "to_role": msg.to_role,
            "subject": msg.subject,
            "message": msg.message,
            "sent_at": msg.sent_at,
            "status": msg.status.value
        })
    
    return {
        "tender_id": tender.tender_id,
        "project_name": tender.project_name,
        "message_count": len(messages),
        "messages": result
    }

@router.get("/tender/{tender_id}/summarize")
async def summarize_tender_thread(
    tender_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate an AI summary of a communication thread for a specific tender"""
    tender = db.query(Tender).filter(Tender.id == tender_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    messages = db.query(Communication).filter(
        Communication.tender_id == tender_id
    ).order_by(Communication.sent_at.asc()).all()
    
    if not messages:
        return {"summary": "No communications found for this tender.", "status": "empty"}
    
    # Format messages for AI context
    thread_content = ""
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.from_user_id).first()
        sender_name = sender.full_name if sender else "System"
        thread_content += f"From: {sender_name} ({msg.from_role})\n"
        thread_content += f"Subject: {msg.subject}\n"
        thread_content += f"Message: {msg.message}\n"
        thread_content += "---\n"

    system_prompt = "You are an expert procurement assistant. Summarize the following communication thread for a government tender."
    user_prompt = f"Tender: {tender.tender_id} - {tender.project_name}\n\nCommunication Thread:\n{thread_content}\n\nProvide a concise summary of the discussion, key decisions made, and any pending actions."

    # Attempt AI Summarization
    if claude_client:
        try:
            message = claude_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            return {"summary": message.content[0].text, "status": "ai_generated", "model": "Claude 3.5 Sonnet"}
        except Exception as e:
            logger.error(f"Claude summarization failed: {e}")

    if gemini_model:
        try:
            response = gemini_model.generate_content(f"{system_prompt}\n\n{user_prompt}")
            return {"summary": response.text, "status": "ai_generated", "model": "Gemini 1.5 Pro"}
        except Exception as e:
            logger.error(f"Gemini summarization failed: {e}")

    # Heuristic fallback if AI unavailable
    summary = f"Thread contains {len(messages)} messages. "
    last_msg = messages[-1]
    last_sender = db.query(User).filter(User.id == last_msg.from_user_id).first()
    summary += f"The latest interaction was a {last_msg.communication_type.value} from {last_sender.full_name if last_sender else 'System'} regarding '{last_msg.subject}'. "
    if any(m.requires_action and not m.action_taken for m in messages):
        summary += "There are pending actions required."
    
    return {"summary": summary, "status": "heuristic", "info": "AI models currently unavailable."}

@router.get("/stats")
async def get_communication_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get communication statistics for current user"""
    unread_count = db.query(Communication).filter(
        Communication.to_role == current_user.role.value,
        Communication.read_at == None
    ).count()
    
    action_required_count = db.query(Communication).filter(
        Communication.to_role == current_user.role.value,
        Communication.requires_action == True,
        Communication.action_taken == False
    ).count()
    
    sent_count = db.query(Communication).filter(
        Communication.from_user_id == current_user.id
    ).count()
    
    return {
        "unread": unread_count,
        "action_required": action_required_count,
        "sent": sent_count
    }
