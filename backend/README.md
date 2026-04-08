# RTGS Procurement System - Backend API

FastAPI-based REST API for the RTGS Procurement Management System

## Quick Start

### 1. Setup Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Setup Database

```sql
CREATE DATABASE rtgs_procurement;
```

### 5. Run Server

```bash
python main.py
```

Server runs on: http://localhost:8000  
API Docs: http://localhost:8000/api/docs

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment template
├── database/
│   ├── models.py          # SQLAlchemy models
│   └── connection.py      # Database session management
├── routers/               # API endpoints
│   ├── auth.py           # Authentication & JWT
│   ├── tenders.py        # Tender management
│   ├── evaluation.py     # Bid evaluation
│   ├── risks.py          # Risk detection
│   ├── reports.py        # Report generation
│   ├── users.py          # User management
│   ├── settings.py       # Settings
│   └── ai_validator.py   # AI validation
└── middleware/
    └── audit_logger.py   # Audit trail logging
```

## Database Models

### User
- Authentication and RBAC
- Roles: PROCUREMENT_OFFICER, APPROVING_AUTHORITY, EVALUATION_COMMITTEE, AUDITOR, VENDOR_VIEW

### Tender
- RFP/Tender information
- Lifecycle: DRAFT → ACTIVE → UNDER_EVALUATION → PENDING_APPROVAL → APPROVED/CLOSED

### Vendor
- Vendor master data
- Blacklist management

### Bid
- Vendor bid submissions
- Technical & financial scores
- L1/L2/L3 rankings

### RiskAlert
- AI-detected anomalies
- Risk types: LOW_BID, COLLUSION, SINGLE_BID, COMPLIANCE

### AuditLog
- Comprehensive audit trail
- Tracks all API requests

## API Authentication

All protected endpoints require JWT token:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo", "role": "PROCUREMENT_OFFICER"}'

# Use token in subsequent requests
curl http://localhost:8000/api/tenders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Development

### Run in Development Mode
```bash
uvicorn main:app --reload --port 8000
```

### View Logs
```bash
tail -f logs/api.log
```

### Database Migrations
```bash
# Tables are auto-created on first run
# For production, use Alembic for migrations
```

## Security

- JWT tokens expire after 8 hours
- Passwords hashed with bcrypt
- CORS restricted to frontend origins
- All requests logged in audit trail
- Role-based access control on all endpoints

## AI Features

### Risk Detection Algorithm
- Low bid: < 80% of estimated budget → HIGH risk
- Collusion: Bids within 5% variance → MEDIUM risk
- Single bid: < 3 bids → MEDIUM risk

### Evaluation Scoring
- Financial evaluation: Inverse scoring (lower is better)
- Technical compliance: Normalized to 100%
- L1/L2/L3 ranking: Automatic based on financial bid

## Production Deployment

### Using Gunicorn
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:postgres@localhost:5432/rtgs_procurement |
| SECRET_KEY | JWT secret key (min 32 chars) | - |
| ALGORITHM | JWT algorithm | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token expiry time | 480 |
| ALLOWED_ORIGINS | CORS allowed origins | http://localhost:8080 |

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -c "\l"
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

## API Testing

### Using curl
```bash
# Health check
curl http://localhost:8000/api/health

# Get tenders
curl http://localhost:8000/api/tenders \
  -H "Authorization: Bearer TOKEN"
```

### Using Swagger UI
Navigate to: http://localhost:8000/api/docs

## License

Government of Andhra Pradesh - Internal Use Only
