"""
Audit Logger Middleware - Comprehensive audit trail for all API requests
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from fastapi import Response
from datetime import datetime
from sqlalchemy.orm import Session
import logging

from database.connection import SessionLocal
from database.models import AuditLog

logger = logging.getLogger(__name__)

class AuditLoggerMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests for audit purposes"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip audit logging for health check, docs, and OPTIONS requests
        if request.method == "OPTIONS" or request.url.path in ["/api/health", "/api/docs", "/api/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Get user info from request state (set by auth dependency)
        user_id = None
        if hasattr(request.state, "user"):
            user_id = request.state.user.id
        
        # Process request
        response = await call_next(request)
        
        # Log to database (async in background)
        try:
            db = SessionLocal()
            audit_entry = AuditLog(
                user_id=user_id,
                action=f"{request.method} {request.url.path}",
                method=request.method,
                endpoint=request.url.path,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                status_code=response.status_code,
                timestamp=datetime.utcnow()
            )
            db.add(audit_entry)
            db.commit()
            db.close()
        except Exception as e:
            logger.error(f"Failed to log audit entry: {e}")
        
        return response
