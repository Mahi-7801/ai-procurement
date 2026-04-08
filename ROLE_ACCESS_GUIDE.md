# Role-Based Module Access - Quick Reference

## 🎭 Module Access by Role

### 📊 Dashboard
**All Roles** ✅
- Procurement Officer
- Approving Authority  
- Evaluation Committee
- Auditor
- Vendor View (Limited)

---

### 📄 Tenders
**4 Roles** ✅
- Procurement Officer (Create/Edit)
- Approving Authority (Approve/Delete)
- Evaluation Committee (View)
- Auditor (View/Read-only)

❌ Vendor View

---

### 📈 Evaluations
**4 Roles** ✅
- Procurement Officer (Run/View)
- Evaluation Committee (Full Access)
- Approving Authority (Approve)
- Auditor (View/Read-only)

❌ Vendor View

---

### ⚠️ Risk & Alerts
**4 Roles** ✅
- Procurement Officer (Monitor)
- Evaluation Committee (Monitor)
- Approving Authority (Review)
- Auditor (Full Access)

❌ Vendor View

---

### 📋 Reports
**4 Roles** ✅
- Procurement Officer (Generate)
- Evaluation Committee (Generate)
- Approving Authority (All Reports)
- Auditor (All Reports + Audit Logs)

❌ Vendor View

---

### 👥 Users
**2 Roles** ✅
- Approving Authority (Manage)
- Auditor (View/Audit)

❌ Procurement Officer  
❌ Evaluation Committee  
❌ Vendor View

---

### ⚙️ Settings
**2 Roles** ✅
- Procurement Officer (Configure)
- Approving Authority (Configure)

❌ Evaluation Committee  
❌ Auditor  
❌ Vendor View

---

## 🔑 Quick Access Guide

### I need to... Which role should I use?

| Task | Recommended Role |
|------|-----------------|
| Create a new tender | **Procurement Officer** |
| Approve a tender | **Approving Authority** |
| Evaluate vendor bids | **Evaluation Committee** |
| Review AI risk alerts | **Auditor** or **Procurement Officer** |
| Generate evaluation report | **Evaluation Committee** or **Procurement Officer** |
| Manage user accounts | **Approving Authority** |
| Audit system activities | **Auditor** |
| Configure system settings | **Approving Authority** or **Procurement Officer** |
| View tender documents | **Any role except Vendor View** |

---

## 🎯 Role Hierarchy

```
Approving Authority (Highest Access)
    ↓
Procurement Officer (Operational Lead)
    ↓
Evaluation Committee (Technical Expert)
    ↓
Auditor (Read-Only + Audit)
    ↓
Vendor View (Minimal Access)
```

---

## 🧪 Testing Different Roles

### Quick Demo Access:
1. Go to login page
2. Select role from dropdown
3. Click "Quick Demo"
4. Observe which modules appear in sidebar

### Test Each Role:
- **Procurement Officer**: Should see 6 modules
- **Approving Authority**: Should see ALL 7 modules
- **Evaluation Committee**: Should see 5 modules
- **Auditor**: Should see 6 modules (read-only)
- **Vendor View**: Should see 1 module (Dashboard only)

---

## 📱 Navigation Visibility

The sidebar navigation automatically shows/hides modules based on your role. You will only see modules you have permission to access.

---

**For detailed documentation, see**: `RBAC_DOCUMENTATION.md`
