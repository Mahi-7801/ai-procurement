"""Users Router - User management"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User
from routers.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "role": u.role.value, "department": u.department} for u in users]
