# RTGS Procurement Management System

**AI-Enabled Procurement System for Real Time Governance Society (RTGS)**  
**Government of Andhra Pradesh**

---

## 🎯 Project Overview

A comprehensive, government-grade procurement management system with AI-powered bid evaluation, risk detection, and compliance monitoring. Built for on-premise deployment with strict security and DPDP Act compliance.

### Key Features

✅ **Role-Based Access Control (RBAC)** - 5 user roles with granular permissions  
✅ **AI-Powered Bid Evaluation** - Automated scoring and ranking  
✅ **Risk & Anomaly Detection** - Real-time collusion, low-bid, and compliance alerts  
✅ **Pre-RFP AI Validator** - Document completeness and policy compliance checks  
✅ **Comprehensive Audit Trail** - Every action logged with timestamps  
✅ **Explainable AI** - Human-readable explanations for all AI decisions  
✅ **On-Premise Deployment** - No external cloud dependencies  
✅ **DPDP Act Compliant** - Data privacy and security built-in  

---

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **State Management**: React Query
- **Routing**: React Router v6
- **Authentication**: JWT tokens

### Backend (Python + FastAPI)
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT with bcrypt password hashing
- **File Processing**: PDF, DOCX, Excel support
- **AI/ML**: Scikit-learn (for risk detection algorithms)
- **Logging**: Comprehensive audit trail middleware

---

## 📁 Project Structure

```
AI-Procurement/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Application entry point
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment configuration template
│   ├── database/
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   └── connection.py     # Database connection & session management
│   ├── routers/              # API route handlers
│   │   ├── auth.py           # Authentication & JWT
│   │   ├── tenders.py        # Tender CRUD operations
│   │   ├── evaluation.py     # Bid evaluation engine
│   │   ├── risks.py          # Risk detection algorithms
│   │   ├── reports.py        # Report generation
│   │   ├── users.py          # User management
│   │   ├── settings.py       # System settings
│   │   └── ai_validator.py   # Pre-RFP AI validation
│   └── middleware/
│       └── audit_logger.py   # Audit trail middleware
│
├── src/                       # React frontend
│   ├── pages/                # Page components
│   │   ├── Login.tsx         # Login with role selection
│   │   ├── Dashboard.tsx     # Main dashboard
│   │   ├── Tenders.tsx       # Tender management
│   │   ├── Evaluations.tsx   # Bid evaluation interface
│   │   └── Risks.tsx         # Risk & anomaly detection
│   ├── components/           # Reusable components
│   │   ├── DashboardLayout.tsx
│   │   └── dashboard/        # Dashboard widgets
│   └── lib/                  # Utilities
│       ├── auth-context.tsx  # Authentication context
│       └── mock-data.ts      # Mock data for development
│
└── package.json              # Node.js dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **PostgreSQL** 14+

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend will run on `http://localhost:8080`

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Run the server
python main.py
```

The backend API will run on `http://localhost:8000`

API Documentation: `http://localhost:8000/api/docs`

### Database Setup

```sql
-- Create database
CREATE DATABASE rtgs_procurement;

-- The tables will be created automatically on first run
```

---

## 👥 User Roles

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Procurement Officer** | Full tender management | Create/edit tenders, run evaluations, view all data |
| **Approving Authority** | Approval workflows | Approve tenders, finalize evaluations, delete tenders |
| **Evaluation Committee** | Bid evaluation | Evaluate bids, run AI analysis, generate reports |
| **Auditor (RTGS)** | Read-only + audit logs | View all data, access audit trails, compliance monitoring |
| **Vendor View** | Limited read-only | View published tenders only (optional) |

---

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with secure token storage
- Role-based access control (RBAC) on all endpoints
- Password hashing with bcrypt
- Session timeout after 8 hours

### Data Protection
- Encryption at rest (PostgreSQL encryption)
- Encryption in transit (HTTPS/TLS)
- Vendor data anonymization in reports
- DPDP Act compliant data handling

### Audit Trail
- Every API request logged with:
  - User ID and role
  - Timestamp
  - Action performed
  - IP address and user agent
  - AI recommendations used
  - Response status

---

## 🤖 AI Features

### 1. Pre-RFP Validation
- **Completeness Check**: Identifies missing clauses
- **Policy Compliance**: Validates against procurement rules
- **Risk Flags**: Highlights potential issues
- **Suggestions**: Recommends improvements

### 2. Bid Evaluation Engine
- **Technical Scoring**: Automated technical compliance evaluation
- **Financial Analysis**: L1/L2/L3 ranking calculation
- **Risk Assessment**: Past performance risk scoring
- **Comparative Analysis**: Multi-vendor comparison

### 3. Risk & Anomaly Detection
- **Low Bid Detection**: Flags bids significantly below market rate
- **Collusion Detection**: Identifies similar pricing patterns
- **Single Bid Alerts**: Warns about low participation
- **Compliance Monitoring**: Checks for missing documentation

### 4. Explainable AI
All AI decisions include:
- Confidence score
- Human-readable explanation
- Model version used
- Recommendation rationale

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Tenders
- `GET /api/tenders` - List all tenders
- `GET /api/tenders/{id}` - Get tender details
- `POST /api/tenders` - Create new tender
- `PUT /api/tenders/{id}` - Update tender
- `POST /api/tenders/{id}/publish` - Publish tender
- `GET /api/tenders/stats/summary` - Dashboard statistics

### Evaluation
- `GET /api/evaluation/tender/{id}/bids` - Get all bids for tender
- `POST /api/evaluation/tender/{id}/evaluate` - Run AI evaluation
- `GET /api/evaluation/tender/{id}/comparison` - Get comparison data

### Risks
- `GET /api/risks/tender/{id}/alerts` - Get risk alerts for tender
- `GET /api/risks/all` - Get all risk alerts
- `POST /api/risks/tender/{id}/detect` - Run AI risk detection

### Reports
- `GET /api/reports` - List all reports
- `POST /api/reports/generate/{id}` - Generate evaluation report

---

## 🎨 UI/UX Guidelines

### Theme: Professional Government Dashboard

**Colors:**
- **Blue** (#2563EB) - Primary governance color
- **Green** (#16A34A) - Success, L1 bidder, approved
- **Yellow** (#EAB308) - Warnings, medium priority
- **Orange** (#F97316) - Pending actions
- **Red** (#DC2626) - Alerts, high priority, risks

**Typography:**
- Primary: Inter/Roboto
- Monospace: For tender IDs, codes

**Layout:**
- Card-based design
- Left-to-right information flow
- No flashy animations
- Clean, professional aesthetic

---

## 🔄 Deployment

### On-Premise Deployment

#### Frontend (Nginx)
```nginx
server {
    listen 80;
    server_name procurement.ap.gov.in;
    
    root /var/www/rtgs-procurement/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

#### Backend (Systemd Service)
```ini
[Unit]
Description=RTGS Procurement API
After=network.target postgresql.service

[Service]
Type=simple
User=rtgs
WorkingDirectory=/opt/rtgs-procurement/backend
Environment="PATH=/opt/rtgs-procurement/backend/venv/bin"
ExecStart=/opt/rtgs-procurement/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/rtgs_procurement
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
ALLOWED_ORIGINS=http://localhost:8080
UPLOAD_DIR=./uploads
REPORTS_DIR=./reports
AI_MODEL_VERSION=1.0.0
```

---

## 🧪 Testing

```bash
# Frontend tests
npm run test

# Backend tests (to be implemented)
pytest
```

---

## 📚 Documentation

- **API Documentation**: http://localhost:8000/api/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/api/health

---

## ⚠️ Explicitly Excluded Features

❌ Vendor bid submission portal  
❌ Payment/EMD processing  
❌ Replacing AP eProcurement system  
❌ Public login/registration  

This system is designed to **augment** existing eProcurement systems, not replace them.

---

## 🤝 Support & Maintenance

**Developed for:**  
Real Time Governance Society (RTGS)  
Government of Andhra Pradesh

**Technical Stack:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Python 3.10 + FastAPI + PostgreSQL
- AI/ML: Scikit-learn + Custom algorithms

---

## 📄 License

Government of Andhra Pradesh - Internal Use Only

---

## 🔄 Version History

**v1.0.0** (Current)
- Initial release
- Core CRUD operations
- AI-powered evaluation
- Risk detection
- Audit logging
- Role-based access control

---

## 📞 Contact

For technical support or queries:
- Email: rtgs@ap.gov.in
- Website: https://rtgs.ap.gov.in
#   a i - p r o c u r e m e n t  
 