"""
Authentication Router - JWT-based authentication with RBAC
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional
import os
import bcrypt

from database.connection import get_db
from database.models import User, UserRole

router = APIRouter()
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# Pydantic models
class LoginRequest(BaseModel):
    username: str
    password: str
    role: UserRole

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    department: Optional[str] = None

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash using direct bcrypt implementation"""
    try:
        # Convert password to bytes and truncate to 72 bytes (bcrypt limit)
        password_bytes = plain_password.encode('utf-8')[:72]
        # Hash should be bytes or string starting with $2b$, etc.
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        # Fallback to passlib if for some reason direct bcrypt fails (legacy hashes)
        return pwd_context.verify(plain_password[:72], hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password using direct bcrypt implementation"""
    # Convert password to bytes and truncate to 72 bytes (bcrypt limit)
    password_bytes = password.encode('utf-8')[:72]
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def require_role(*allowed_roles: UserRole):
    """Decorator to enforce role-based access control"""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(r.value for r in allowed_roles)}"
            )
        return current_user
    return role_checker

# Routes
@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint - authenticate user and return JWT token
    For demo purposes, accepts any password for existing users
    """
    # Query user
    user = db.query(User).filter(User.username == request.username).first()
    
    # For demo/development: create user if doesn't exist
    if not user:
        user = User(
            username=request.username,
            email=f"{request.username}@rtgs.ap.gov.in",
            hashed_password=get_password_hash(request.password),
            full_name=request.username.replace("_", " ").title(),
            role=request.role,
            department="Government of Andhra Pradesh"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Verify password (in production)
    # if not verify_password(request.password, user.hashed_password):
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Incorrect username or password"
    #     )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "department": user.department
        }
    }

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register new user (admin only in production)"""
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create new user
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        department=user_data.department
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "username": new_user.username
    }

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "department": current_user.department,
        "is_active": current_user.is_active
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout endpoint (client should discard token)"""
    return {"message": "Logged out successfully"}
