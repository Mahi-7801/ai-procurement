"""
Database connection and session management
PostgreSQL connection with connection pooling
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator
import os
from dotenv import load_dotenv

load_dotenv()

def clean_db_url(url: str) -> str:
    if not url or not isinstance(url, str) or len(url.strip()) < 5:
        print("DEBUG: DATABASE_URL is empty or invalid. Falling back to SQLite.")
        return "sqlite:///./rtgs_procurement.db"
    
    # Remove whitespace and quotes
    url = url.strip().strip('"').strip("'")
    # Fix Render/Heroku 'postgres://' vs SQLAlchemy 'postgresql://'
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    
    # Debug log (sanitized)
    if url.startswith("postgresql"):
        print(f"DEBUG: Using PostgreSQL connection (length: {len(url)})")
    else:
        print(f"DEBUG: Using other connection type: {url.split(':')[0]}...")
        
    return url

# Primary Database configuration (SQLite fallback for portability)
DATABASE_URL = clean_db_url(os.getenv(
    "DATABASE_URL",
    "sqlite:///./rtgs_procurement.db"
))

# Historical Database configuration (SQLite fallback)
HISTORICAL_DATABASE_URL = clean_db_url(os.getenv(
    "HISTORICAL_DATABASE_URL",
    "sqlite:///./historical_tenders.db"
))


# Create engines
# For SQLite, we need connect_args={"check_same_thread": False}
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=False
    )

if HISTORICAL_DATABASE_URL.startswith("sqlite"):
    historical_engine = create_engine(
        HISTORICAL_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    historical_engine = create_engine(
        HISTORICAL_DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_recycle=3600,
        echo=False
    )

# Session factories
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
HistoricalSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=historical_engine)

async def init_db():
    """Initialize database - create all tables"""
    from database.models import Base
    import database.communication_models # Import to register communication tables
    Base.metadata.create_all(bind=engine)
    Base.metadata.create_all(bind=historical_engine)

async def close_db():
    """Close database connections"""
    engine.dispose()

def get_db() -> Generator[Session, None, None]:
    """
    Dependency for getting database session
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
