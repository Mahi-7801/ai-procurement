# Communication Module - Quick Reference

## 🚀 **Access the Module**

**URL**: http://localhost:8080/dashboard/communications

**Who Can Access:**
- ✅ Procurement Officer
- ✅ Approving Authority
- ✅ Evaluation Committee
- ✅ Auditor
- ❌ Vendor View (no access)

---

## 📨 **Message Types**

| Type | From → To | Stage | Action Required |
|------|-----------|-------|----------------|
| **TENDER_INTIMATION** | PO → Vendor | RFP Published | No |
| **CLARIFICATION_REQUEST** | PO → EC | Pre-RFP | Yes |
| **EVALUATION_REQUEST** | PO → EC | Evaluation | Yes |
| **APPROVAL_REQUEST** | PO → AA | Approval | Yes |
| **EVALUATION_REPORT** | EC → PO | Evaluation | No |
| **COMPLIANCE_REMARK** | EC → PO | Evaluation | Yes |
| **APPROVAL_DECISION** | AA → PO | Approval | No |
| **REJECTION_DECISION** | AA → PO | Approval | No |
| **QUERY** | AA → PO | Approval | Yes |
| **AUDIT_OBSERVATION** | AUD → AA | Post-Approval | Yes |
| **COMPLIANCE_NOTICE** | AUD → PO | Post-Approval | Yes |
| **CLARIFICATION_RESPONSE** | Vendor → PO | Bid Submission | No |

*PO = Procurement Officer, AA = Approving Authority, EC = Evaluation Committee, AUD = Auditor*

---

## 🎯 **Message Status Flow**

```
SENT → DELIVERED → READ → ACKNOWLEDGED → ACTION_TAKEN
```

1. **SENT** - Message sent by sender
2. **DELIVERED** - Delivered to recipient's inbox
3. **READ** - Recipient opened the message
4. **ACKNOWLEDGED** - Recipient acknowledged receipt
5. **ACTION_TAKEN** - Required action completed

---

## 🎨 **Visual Indicators**

### **Priority Levels**
- 🔵 **LOW** - Blue badge
- ⚪ **NORMAL** - Gray badge
- 🟠 **HIGH** - Orange badge
- 🔴 **URGENT** - Red badge

### **Message Status**
- 📧 **Unread** - Blue background, Mail icon
- 📬 **Read** - White background, MailOpen icon
- ⚠️ **Action Required** - Orange badge
- ✅ **Action Completed** - Green badge with checkmark

---

## 📊 **Dashboard Statistics**

**4 Key Metrics:**
1. **Unread** - Number of unread messages
2. **Action Required** - Messages needing your action
3. **Sent** - Messages you've sent
4. **Total** - All communications

---

## 🔀 **Routing Examples**

### **Example 1: Request Evaluation**
```
Procurement Officer wants evaluation
  ↓
Clicks "New Message"
  ↓
Selects: Type = "EVALUATION_REQUEST"
  ↓
System routes to: EVALUATION_COMMITTEE
  ↓
Appears in EC inbox with "Action Required" badge
```

### **Example 2: Send Approval Decision**
```
Approving Authority approves tender
  ↓
Sends "APPROVAL_DECISION"
  ↓
System routes to: PROCUREMENT_OFFICER
  ↓
Updates tender status automatically
  ↓
Logged in audit trail
```

### **Example 3: Audit Observation**
```
Auditor finds issue
  ↓
Sends "AUDIT_OBSERVATION"
  ↓
System routes to: APPROVING_AUTHORITY
  ↓
Marked as "Action Required"
  ↓
Visible in audit logs
```

---

## 🎯 **Quick Actions**

### **In Inbox:**
- Click message to read
- Mark as read
- Acknowledge
- Take action

### **In Sent:**
- View delivery status
- See read receipts
- Track acknowledgments

---

## 📱 **UI Layout**

```
┌─────────────────────────────────────────┐
│  Communications                         │
│  Role-based message routing             │
│  [New Message Button]                   │
├─────────────────────────────────────────┤
│  [Unread] [Action Req] [Sent] [Total]  │
├─────────────────────────────────────────┤
│  [Inbox Tab] [Sent Tab]                 │
├─────────────────────────────────────────┤
│  📧 Message 1 - Unread                  │
│  📬 Message 2 - Read                    │
│  📧 Message 3 - Action Required ⚠️      │
└─────────────────────────────────────────┘
```

---

## 🔐 **Security Rules**

1. ✅ **Role-Based Visibility** - Only see messages for your role
2. ✅ **Automatic Routing** - System enforces routing rules
3. ✅ **Audit Trail** - All messages logged
4. ✅ **Tender-Linked** - Every message tied to tender
5. ✅ **Stage-Aware** - Routing changes with tender stage

---

## ⚡ **Key Benefits**

| Benefit | Description |
|---------|-------------|
| **No Email** | All communications in one place |
| **Auto-Routing** | System decides recipients |
| **Trackable** | Complete message history |
| **Actionable** | Clear action tracking |
| **Auditable** | Full audit trail |
| **Secure** | Role-based access |

---

## 🧪 **Test It Now**

1. **Login** to http://localhost:8080
2. **Select any role** (except Vendor View)
3. **Click "Quick Demo"**
4. **Go to Communications** in sidebar
5. **Explore inbox and sent messages**

---

## 📚 **Documentation**

- **Full Guide**: `COMMUNICATION_MODULE_DOCUMENTATION.md`
- **Implementation**: `COMMUNICATION_IMPLEMENTATION_SUMMARY.md`
- **API Docs**: http://localhost:8000/api/docs

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: February 10, 2026
