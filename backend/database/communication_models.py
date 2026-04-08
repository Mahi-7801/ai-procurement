"""
Communication Management Models - Role-based message routing
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum, JSON
from datetime import datetime
import enum

from database.models import Base

class CommunicationType(str, enum.Enum):
    """Types of communications in the system"""
    TENDER_INTIMATION = "TENDER_INTIMATION"
    CLARIFICATION_REQUEST = "CLARIFICATION_REQUEST"
    EVALUATION_REQUEST = "EVALUATION_REQUEST"
    APPROVAL_REQUEST = "APPROVAL_REQUEST"
    VENDOR_NOTICE = "VENDOR_NOTICE"
    APPROVAL_DECISION = "APPROVAL_DECISION"
    REJECTION_DECISION = "REJECTION_DECISION"
    QUERY = "QUERY"
    EVALUATION_REPORT = "EVALUATION_REPORT"
    COMPLIANCE_REMARK = "COMPLIANCE_REMARK"
    AUDIT_OBSERVATION = "AUDIT_OBSERVATION"
    COMPLIANCE_NOTICE = "COMPLIANCE_NOTICE"
    STATUS_UPDATE = "STATUS_UPDATE"
    CLARIFICATION_RESPONSE = "CLARIFICATION_RESPONSE"

class WorkflowStage(str, enum.Enum):
    """Procurement workflow stages"""
    PRE_RFP = "PRE_RFP"
    RFP_PUBLISHED = "RFP_PUBLISHED"
    BID_SUBMISSION = "BID_SUBMISSION"
    EVALUATION = "EVALUATION"
    APPROVAL = "APPROVAL"
    POST_APPROVAL = "POST_APPROVAL"
    AWARD = "AWARD"
    CLOSED = "CLOSED"

class MessageStatus(str, enum.Enum):
    """Message delivery and read status"""
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    ACTION_TAKEN = "ACTION_TAKEN"

class Communication(Base):
    """
    Role-based communication routing
    Messages automatically routed based on tender stage and user roles
    """
    __tablename__ = "communications"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Routing information
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)
    workflow_stage = Column(Enum(WorkflowStage), nullable=False, index=True)
    communication_type = Column(Enum(CommunicationType), nullable=False)
    
    # Sender information (role-based)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    from_role = Column(String(50), nullable=False)  # Role at time of sending
    
    # Recipient information (role-based, not person-based)
    to_role = Column(String(50), nullable=False, index=True)  # Target role
    to_user_id = Column(Integer, ForeignKey("users.id"))  # Actual recipient (assigned by system)
    
    # Message content
    subject = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    
    # Attachments and references
    attachments = Column(JSON)  # List of file paths
    reference_id = Column(String(100))  # Reference to parent message (for threads)
    
    # Status tracking
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT)
    sent_at = Column(DateTime, default=datetime.utcnow, index=True)
    delivered_at = Column(DateTime)
    read_at = Column(DateTime)
    acknowledged_at = Column(DateTime)
    
    # Action tracking
    requires_action = Column(Boolean, default=False)
    action_taken = Column(Boolean, default=False)
    action_details = Column(JSON)
    
    # System metadata
    is_system_generated = Column(Boolean, default=False)
    auto_routed = Column(Boolean, default=True)
    priority = Column(String(20), default="NORMAL")  # LOW, NORMAL, HIGH, URGENT
    
    # Audit trail
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CommunicationThread(Base):
    """
    Group related communications into threads
    Maintains conversation history for each tender/topic
    """
    __tablename__ = "communication_threads"
    
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)
    thread_subject = Column(String(500), nullable=False)
    thread_type = Column(Enum(CommunicationType), nullable=False)
    
    # Thread participants (roles)
    participant_roles = Column(JSON)  # List of roles involved
    
    # Thread status
    is_active = Column(Boolean, default=True)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NotificationPreference(Base):
    """
    User notification preferences
    Controls how users receive communications
    """
    __tablename__ = "notification_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Notification channels
    email_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
    dashboard_enabled = Column(Boolean, default=True)
    
    # Notification types
    notify_on_new_message = Column(Boolean, default=True)
    notify_on_approval_request = Column(Boolean, default=True)
    notify_on_clarification = Column(Boolean, default=True)
    notify_on_deadline = Column(Boolean, default=True)
    
    # Digest settings
    daily_digest = Column(Boolean, default=False)
    weekly_digest = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RoutingRule(Base):
    """
    Configurable routing rules for automatic message routing
    Defines who receives what based on stage and communication type
    """
    __tablename__ = "routing_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Rule definition
    workflow_stage = Column(Enum(WorkflowStage), nullable=False)
    communication_type = Column(Enum(CommunicationType), nullable=False)
    from_role = Column(String(50), nullable=False)
    to_role = Column(String(50), nullable=False)
    
    # Rule behavior
    is_active = Column(Boolean, default=True)
    requires_acknowledgment = Column(Boolean, default=False)
    auto_escalate_hours = Column(Integer)  # Auto-escalate if no response
    
    # Metadata
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
