"""
Database Models for RTGS Procurement System
SQLAlchemy ORM models with audit trail support
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    """User roles for RBAC"""
    ADMIN = "ADMIN"
    PROCUREMENT_OFFICER = "PROCUREMENT_OFFICER"
    VENDOR = "VENDOR"
    EVALUATION_COMMITTEE = "EVALUATION_COMMITTEE"
    APPROVING_AUTHORITY = "APPROVING_AUTHORITY"
    RTGS_AUDITOR = "RTGS_AUDITOR"
    INTERNAL_VIGILANCE = "INTERNAL_VIGILANCE"

class TenderStatus(str, enum.Enum):
    """Tender lifecycle states"""
    DRAFT = "Draft"
    ACTIVE = "Active"
    UNDER_EVALUATION = "Under Evaluation"
    PENDING_APPROVAL = "Pending Approval"
    APPROVED = "Approved"
    CLOSED = "Closed"
    CANCELLED = "Cancelled"

class RiskLevel(str, enum.Enum):
    """Risk severity levels"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class BidStatus(str, enum.Enum):
    """Bid submission and evaluation lifecycle states"""
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    VALIDATED = "VALIDATED"
    EVALUATED = "EVALUATED"

class User(Base):
    """User model with RBAC"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    department = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenders_created = relationship("Tender", back_populates="created_by_user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Tender(Base):
    """Tender/RFP model"""
    __tablename__ = "tenders"
    
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(String(50), unique=True, nullable=False, index=True)
    project_name = Column(String(500), nullable=False)
    department = Column(String(255), nullable=False)
    estimated_budget = Column(Float, nullable=False)
    status = Column(Enum(TenderStatus), default=TenderStatus.DRAFT)
    description = Column(Text)
    published_date = Column(DateTime)
    closing_date = Column(DateTime)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # RFP document metadata
    rfp_document_path = Column(String(500))
    ai_validation_score = Column(Float)
    ai_validation_report = Column(JSON)
    
    # Relationships
    created_by_user = relationship("User", back_populates="tenders_created")
    bids = relationship("Bid", back_populates="tender")
    risk_alerts = relationship("RiskAlert", back_populates="tender")

class Vendor(Base):
    """Vendor master data"""
    __tablename__ = "vendors"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_code = Column(String(50), unique=True, nullable=False, index=True)
    vendor_name = Column(String(500), nullable=False)
    gstin = Column(String(15))
    pan = Column(String(10))
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    is_blacklisted = Column(Boolean, default=False)
    blacklist_reason = Column(Text)
    is_msme = Column(Boolean, default=False)
    is_startup = Column(Boolean, default=False)
    experience_years = Column(Integer, default=0)
    turnover = Column(Float, default=0.0) # in Crores
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bids = relationship("Bid", back_populates="vendor")
    owner = relationship("User")

class Bid(Base):
    """Vendor bid submissions"""
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    
    # Bid details
    financial_bid = Column(Float, nullable=False)
    technical_score = Column(Float)
    technical_compliance = Column(Float)
    financial_evaluation = Column(Float)
    
    # Rankings
    rank = Column(String(10))  # L1, L2, L3, etc.
    is_l1 = Column(Boolean, default=False)
    is_draft = Column(Boolean, default=False)  # For pre-submission reviews
    compliance_report = Column(JSON)  # Stores AI findings for the vendor
    
    # Risk assessment
    past_performance_risk = Column(Enum(RiskLevel))
    
    # Documents
    technical_document_path = Column(String(500))
    financial_document_path = Column(String(500))
    
    # Final Score
    eligibility_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    specs_score = Column(Float, default=0.0)
    docs_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    ai_analysis = Column(JSON) # Detailed AI breakdown (missing GST, risk flags, etc)
    status = Column(Enum(BidStatus), default=BidStatus.DRAFT)
    submission_duration_ms = Column(Integer) # Time taken for submission process

    # Metadata
    submitted_at = Column(DateTime, default=datetime.utcnow)
    evaluated_at = Column(DateTime)
    evaluated_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    tender = relationship("Tender", back_populates="bids")
    vendor = relationship("Vendor", back_populates="bids")

class RiskAlert(Base):
    """AI-detected risk and anomalies"""
    __tablename__ = "risk_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    
    # Risk details
    risk_type = Column(String(50), nullable=False)  # LOW_BID, COLLUSION, SINGLE_BID, COMPLIANCE
    risk_level = Column(Enum(RiskLevel), nullable=False)
    message = Column(String(500), nullable=False)
    explanation = Column(Text, nullable=False)  # Explainable AI text
    
    # AI metadata
    ai_confidence = Column(Float)
    ai_model_version = Column(String(50))
    
    # Status
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Timestamps
    detected_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tender = relationship("Tender", back_populates="risk_alerts")

class AuditLog(Base):
    """Comprehensive audit trail"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Action details
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))  # tender, bid, user, etc.
    resource_id = Column(Integer)
    
    # Request details
    method = Column(String(10))  # GET, POST, PUT, DELETE
    endpoint = Column(String(255))
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    
    # AI recommendation tracking
    ai_recommendation_used = Column(Boolean, default=False)
    ai_recommendation_data = Column(JSON)
    
    # Response
    status_code = Column(Integer)
    
    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class Report(Base):
    """Generated reports storage"""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(50), nullable=False)  # EVALUATION, RISK_ANALYSIS, AUDIT
    tender_id = Column(Integer, ForeignKey("tenders.id"))
    
    # Report metadata
    title = Column(String(500), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_format = Column(String(10))  # PDF, XLSX, DOCX
    
    # Generation details
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # AI involvement
    includes_ai_findings = Column(Boolean, default=False)
    ai_findings_summary = Column(JSON)

class BidType(str, enum.Enum):
    """Bid Category"""
    SERVICE = "SERVICE"
    PRODUCT = "PRODUCT"

class DataSource(str, enum.Enum):
    """Origin of historical data"""
    PDF_UPLOAD = "PDF_UPLOAD"
    USER_FORM = "USER_FORM"

class HistoricalBid(Base):
    """Detailed historical procurement records for AI learning and matching"""
    __tablename__ = "historical_bids"
    
    id = Column(Integer, primary_key=True, index=True)
    bid_number = Column(String(100), unique=True, index=True)
    title = Column(String(500), nullable=False)
    bid_type = Column(Enum(BidType), nullable=False)
    category = Column(String(200), index=True)
    keywords = Column(Text)  # Used for the Keyword Matching System
    
    # Administrative Hierarchy
    ministry = Column(String(255))
    department = Column(String(255))
    organisation = Column(String(255))
    
    # Financial & Technical Parameters
    estimated_value = Column(Float)
    emd_amount = Column(Float)
    epbg_percent = Column(Float)
    contract_period = Column(String(100))
    validity_days = Column(Integer)
    experience_years = Column(Integer)
    turnover_percent = Column(Float)
    ld_percent = Column(Float)
    security_deposit = Column(Float)
    
    # Technical Metadata
    standard_clauses = Column(Text)
    pdf_filename = Column(String(500))
    data_source = Column(Enum(DataSource), default=DataSource.USER_FORM)
    template_data = Column(JSON)  # Stores the full raw JSON of the bid
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    """User notifications and alerts"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Optional context
    resource_type = Column(String(50))  # tender, bid, etc.
    resource_id = Column(Integer)
    
    # Relationships
    user = relationship("User")
