# Communication Management Module - Complete Documentation

## 📨 Overview

The Communication Management Module implements **automatic role-based message routing** for the RTGS Procurement System. Messages are automatically routed to the correct role based on tender stage and communication type - **no manual emailing, no WhatsApp, no confusion**.

---

## 🎯 Core Principle

**Communication is linked to:**
1. **Tender ID** - Every message is tied to a specific tender
2. **Current Workflow Stage** - System knows where the tender is in the process
3. **Role (not individual)** - Messages go to roles, not specific people

**System automatically decides:**
- 👉 Who should send
- 👉 Who should receive
- 👉 What format
- 👉 What action is allowed

---

## 🔄 Workflow Stages

| Stage | Description | Active Communication Types |
|-------|-------------|---------------------------|
| **PRE_RFP** | Before RFP publication | Clarification requests, internal queries |
| **RFP_PUBLISHED** | RFP is live | Tender intimations, vendor notices |
| **BID_SUBMISSION** | Bids being collected | Clarification responses, vendor queries |
| **EVALUATION** | Technical/financial evaluation | Evaluation requests, compliance remarks |
| **APPROVAL** | Awaiting authority approval | Approval requests, decisions, queries |
| **POST_APPROVAL** | After approval | Audit observations, compliance notices |
| **AWARD** | Contract awarded | Award letters, final notices |
| **CLOSED** | Tender completed | Status updates, archive notices |

---

## 👥 Role-Wise Communication Capabilities

### 1️⃣ PROCUREMENT_OFFICER

**Role in Communication:** Creator + Initiator

**What they can SEND:**
- ✅ Tender Intimation
- ✅ Clarification Requests
- ✅ Evaluation Requests
- ✅ Approval Requests
- ✅ Vendor Notices (system-generated)

**What they can RECEIVE:**
- ✅ Clarifications from Evaluation Committee
- ✅ Queries from Approving Authority
- ✅ System alerts (missing docs, delays)
- ✅ Evaluation reports
- ✅ Compliance remarks

**Example Flow:**
```
Officer clicks: "Request Technical Evaluation"
  ↓
System routes message to: EVALUATION_COMMITTEE
  ↓
Logged + tracked in audit trail
```

---

### 2️⃣ APPROVING_AUTHORITY

**Role in Communication:** Decision Maker

**What they can RECEIVE:**
- ✅ Approval requests
- ✅ AI-generated summaries (not raw files)
- ✅ Risk alerts
- ✅ Evaluation reports

**What they can SEND:**
- ✅ Approval decisions
- ✅ Rejection decisions
- ✅ Queries back to Procurement Officer

**Special Rules:**
- ❌ Cannot edit tender documents
- ✅ Only decision + remarks allowed

**Example:**
```
"Approve Tender #AP-2026-045"
  ↓
Decision auto-routes to:
  • Procurement Officer
  • Audit log
  • Dashboard status update
```

---

### 3️⃣ EVALUATION_COMMITTEE

**Role in Communication:** Technical & Financial Feedback Provider

**What they can RECEIVE:**
- ✅ Evaluation requests
- ✅ Clarification tasks
- ✅ Bid comparison sheets

**What they can SEND:**
- ✅ Evaluation reports
- ✅ Compliance remarks
- ✅ L1/L2/L3 justifications

**Important:**
- ❌ No direct vendor communication
- ✅ All replies go only via system

**Example:**
```
"Bidder X non-compliant – missing ISO certificate"
  ↓
Routed to: Procurement Officer
  ↓
Logged with timestamp and evidence
```

---

### 4️⃣ AUDITOR (RTGS)

**Role in Communication:** Observer + Compliance Authority

**Access Type:** 🔒 Read-only (except audit observations)

**What they can SEE:**
- ✅ All communications
- ✅ Approval timelines
- ✅ Delay patterns
- ✅ Risk flags

**What they can SEND:**
- ✅ Audit observations
- ✅ Compliance notices

**What they CANNOT do:**
- ❌ Modify data
- ❌ Approve/reject tenders
- ❌ Send operational messages

**Example:**
```
"Repeated clarifications in Tender #AP-2026-045"
  ↓
Routed to: Approving Authority (FYI)
  ↓
Flagged for review
```

---

### 5️⃣ VENDOR_VIEW (Read-Only / Optional)

**Role in Communication:** Transparent Recipient

**What they can RECEIVE:**
- ✅ Tender notifications
- ✅ Clarification requests
- ✅ Status updates
- ✅ Award / rejection letters

**What they can SEND:**
- ✅ Clarification responses (structured form only)

**What they CANNOT see:**
- ❌ Internal notes
- ❌ Evaluation scores
- ❌ Other vendors' data

**Example:**
```
Vendor submits clarification
  ↓
Routed to: Procurement Officer
  ↓
Time-stamped & logged
```

---

## 🔀 Routing Matrix (Behind the Scenes)

### Pre-RFP Stage
| Action | From | To |
|--------|------|-----|
| Clarification Request | Procurement Officer | Evaluation Committee |

### RFP Published Stage
| Action | From | To |
|--------|------|-----|
| Tender Intimation | Procurement Officer | Vendor View |

### Evaluation Stage
| Action | From | To |
|--------|------|-----|
| Evaluation Request | Procurement Officer | Evaluation Committee |
| Evaluation Report | Evaluation Committee | Procurement Officer |
| Compliance Remark | Evaluation Committee | Procurement Officer |

### Approval Stage
| Action | From | To |
|--------|------|-----|
| Approval Request | Procurement Officer | Approving Authority |
| Approval Decision | Approving Authority | Procurement Officer |
| Rejection Decision | Approving Authority | Procurement Officer |
| Query | Approving Authority | Procurement Officer |

### Post-Approval Stage
| Action | From | To |
|--------|------|-----|
| Audit Observation | Auditor | Approving Authority |
| Compliance Notice | Auditor | Procurement Officer |

### Bid Submission Stage
| Action | From | To |
|--------|------|-----|
| Clarification Response | Vendor View | Procurement Officer |
| Vendor Notice | Procurement Officer | Vendor View |

---

## 📊 Communication Types

| Type | Description | Requires Action |
|------|-------------|----------------|
| **TENDER_INTIMATION** | Notify about new tender | No |
| **CLARIFICATION_REQUEST** | Request clarification | Yes |
| **EVALUATION_REQUEST** | Request bid evaluation | Yes |
| **APPROVAL_REQUEST** | Request approval | Yes |
| **VENDOR_NOTICE** | Notice to vendors | No |
| **APPROVAL_DECISION** | Approval granted | No |
| **REJECTION_DECISION** | Approval rejected | No |
| **QUERY** | Question/query | Yes |
| **EVALUATION_REPORT** | Evaluation results | No |
| **COMPLIANCE_REMARK** | Compliance issue | Yes |
| **AUDIT_OBSERVATION** | Audit finding | Yes |
| **COMPLIANCE_NOTICE** | Compliance alert | Yes |
| **STATUS_UPDATE** | Status change | No |
| **CLARIFICATION_RESPONSE** | Response to clarification | No |

---

## 🔐 Security & Audit

### Every Communication is Logged:
- ✅ Sender ID and role
- ✅ Recipient role and assigned user
- ✅ Timestamp (sent, delivered, read, acknowledged)
- ✅ Tender ID and workflow stage
- ✅ Message content and attachments
- ✅ Action required/taken status
- ✅ Auto-routing decision

### Audit Trail Includes:
- Who sent what to whom
- When it was sent, delivered, and read
- What action was required
- What action was taken
- System routing decisions

---

## 🚀 API Endpoints

### Send Message
```http
POST /api/communications/send
```
**Request:**
```json
{
  "tender_id": 1,
  "communication_type": "EVALUATION_REQUEST",
  "subject": "Technical Evaluation Required",
  "message": "Please evaluate bids for Highway Construction project",
  "requires_action": true
}
```

**Response:**
```json
{
  "message": "Communication sent successfully",
  "communication_id": 123,
  "routed_to_role": "EVALUATION_COMMITTEE",
  "routed_to_user": 45,
  "workflow_stage": "EVALUATION"
}
```

### Get Inbox
```http
GET /api/communications/inbox?unread_only=true&requires_action=true
```

### Get Sent Messages
```http
GET /api/communications/sent
```

### Mark as Read
```http
POST /api/communications/{message_id}/mark-read
```

### Acknowledge Message
```http
POST /api/communications/{message_id}/acknowledge
```
**Request:**
```json
{
  "action_details": {
    "action": "Evaluation completed",
    "notes": "All bids evaluated successfully"
  }
}
```

### Get Tender Thread
```http
GET /api/communications/tender/{tender_id}/thread
```

### Get Statistics
```http
GET /api/communications/stats
```

---

## 💻 Frontend Features

### Inbox View
- ✅ Unread message count
- ✅ Action required badges
- ✅ Priority indicators (LOW, NORMAL, HIGH, URGENT)
- ✅ Message status (SENT, DELIVERED, READ, ACKNOWLEDGED, ACTION_TAKEN)
- ✅ Tender reference links
- ✅ Role-based filtering

### Sent Messages View
- ✅ Delivery status tracking
- ✅ Read receipts
- ✅ Target role display
- ✅ Timestamp tracking

### Message Cards
- ✅ From/To role display
- ✅ Subject and preview
- ✅ Tender reference
- ✅ Communication type badge
- ✅ Action required indicator
- ✅ Priority badge

### Statistics Dashboard
- ✅ Unread count
- ✅ Action required count
- ✅ Sent count
- ✅ Total communications

---

## 🎨 UI/UX Design

### Color Coding
- **Unread Messages**: Blue background (#2563EB/5)
- **Action Required**: Orange badge (#F97316)
- **Completed**: Green badge (#16A34A)
- **High Priority**: Orange border
- **Urgent Priority**: Red border

### Icons
- 📧 **Mail**: Unread message
- 📬 **MailOpen**: Read message
- 📤 **Send**: Sent message
- ⚠️ **AlertCircle**: Action required
- ✅ **CheckCircle**: Action completed
- 🕐 **Clock**: Timestamp
- 📄 **FileText**: Communication type

---

## 🔄 With or Without APIs?

### Without APIs (Internal Workflow)
- ✅ Internal workflow routing
- ✅ Dashboard notifications
- ✅ Document-linked messages
- ✅ Audit trail
- ✅ Role-based inbox

### With APIs (Optional Enhancement)
- ✅ Sync to e-Procurement portal
- ✅ Email / SMS alerts
- ✅ RTGS dashboards integration
- ✅ External notifications

**👉 APIs = acceleration, not dependency**

---

## 📁 File Structure

```
backend/
├── database/
│   └── communication_models.py      # Database models
├── routers/
│   └── communications.py            # API endpoints
└── main.py                          # Register router

frontend/
├── src/
│   ├── pages/
│   │   └── Communications.tsx       # Main page
│   ├── components/
│   │   └── DashboardLayout.tsx      # Navigation
│   └── App.tsx                      # Routes
```

---

## 🧪 Testing Scenarios

### Scenario 1: Procurement Officer Requests Evaluation
1. Login as Procurement Officer
2. Go to Communications
3. Click "New Message"
4. Select tender, type = "EVALUATION_REQUEST"
5. System routes to Evaluation Committee
6. Verify message appears in Evaluation Committee inbox

### Scenario 2: Approving Authority Makes Decision
1. Login as Approving Authority
2. Receive approval request in inbox
3. Send approval decision
4. System routes to Procurement Officer
5. Updates tender status automatically

### Scenario 3: Auditor Reviews Communications
1. Login as Auditor
2. View all communications (read-only)
3. Send audit observation
4. Routes to Approving Authority
5. Logged in audit trail

---

## ✅ Benefits

1. **No Manual Routing** - System decides recipients automatically
2. **No Email Chaos** - All communications in one place
3. **Complete Audit Trail** - Every message logged
4. **Role-Based Security** - Users only see what they should
5. **Action Tracking** - Know what needs attention
6. **Tender-Centric** - All messages linked to tenders
7. **Stage-Aware** - Routing changes with tender stage
8. **Transparent** - Everyone knows who said what when

---

## 🚀 Next Steps

1. ✅ Database models created
2. ✅ API endpoints implemented
3. ✅ Frontend page created
4. ✅ Navigation added
5. ⏳ Connect frontend to backend API
6. ⏳ Add notification badges
7. ⏳ Implement email/SMS alerts (optional)
8. ⏳ Add file attachments support

---

**System Status**: ✅ **READY FOR TESTING**

**Last Updated**: February 10, 2026  
**Version**: 1.0.0  
**Module**: Communication Management with Role-Based Routing
