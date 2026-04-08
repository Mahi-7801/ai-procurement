"""
RTGS Procurement Management System - Backend API
Government of Andhra Pradesh
FastAPI-based REST API with RBAC, audit logging, and AI-powered evaluation
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import logging
import os
import traceback
from datetime import datetime
from fastapi import Request
from fastapi.responses import JSONResponse

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Import routers
from routers import auth, tenders, evaluation, risks, reports, users, settings, ai_validator, communications, tender_draft, historical, notifications, monitoring
from middleware.audit_logger import AuditLoggerMiddleware
from database.connection import init_db, close_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/api.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting RTGS Procurement System API...")
    await init_db()
    logger.info("Database initialized successfully")
    yield
    # Shutdown
    logger.info("Shutting down RTGS Procurement System API...")
    await close_db()

# Initialize FastAPI app
app = FastAPI(
    title="RTGS Procurement Management System",
    description="AI-enabled procurement system for Government of Andhra Pradesh",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# -----------------------------------------------------------------------
# MIDDLEWARE ORDER NOTE: In FastAPI/Starlette, add_middleware() wraps in
# reverse — the LAST middleware added runs FIRST (outermost).
# Therefore: add AuditLogger FIRST, then CORS LAST so CORS is outermost
# and handles all OPTIONS preflight requests before anything else.
# -----------------------------------------------------------------------

# Add audit logging middleware FIRST (so it runs INSIDE the CORS wrapper)
app.add_middleware(AuditLoggerMiddleware)

# CORS Configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://192.168.88.22:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handler to capture 500 errors and ensure CORS headers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {str(exc)}")
    logger.error(traceback.format_exc())
    
    # Manually add CORS headers to the error response
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)}
    )
    
    # Get origin from request headers
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
    return response

from fastapi.staticfiles import StaticFiles

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(tenders.router, prefix="/api/tenders", tags=["Tender Management"])
app.include_router(evaluation.router, prefix="/api/evaluation", tags=["Bid Evaluation"])
app.include_router(risks.router, prefix="/api/risks", tags=["Risk & Anomaly Detection"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(users.router, prefix="/api/users", tags=["User Management"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(ai_validator.router, prefix="/api/ai", tags=["AI Validator"])
app.include_router(communications.router, prefix="/api/communications", tags=["Communication Management"])
app.include_router(tender_draft.router, prefix="/api/tender-draft", tags=["Tender Drafting"])
app.include_router(historical.router, prefix="/api/historical", tags=["Historical Data"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Contract Monitoring"])

# Mount uploads directory to serve documents
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "RTGS Procurement System",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "RTGS Procurement Management System API",
        "organization": "Real Time Governance Society, Government of Andhra Pradesh",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=["logs/*", "*.log"],
        log_level="info"
    )
