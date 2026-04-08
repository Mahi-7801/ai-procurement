"""Settings Router - System settings"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User
from routers.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": "Settings endpoint - under development"}
