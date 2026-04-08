# Role-Based Access Control (RBAC) - Module Permissions

## Overview

The RTGS Procurement System implements comprehensive role-based access control where each user role has access to specific modules based on their responsibilities and authorization level.

---

## 🎭 User Roles & Module Access

### 1. **PROCUREMENT_OFFICER** (Procurement Officer)
**Primary Role**: Manage tenders and coordinate procurement activities

**Access to Modules:**
- ✅ **Dashboard** - Full access to overview and statistics
- ✅ **Tenders** - Create, edit, publish, and manage tenders
- ✅ **Evaluations** - View and run bid evaluations
- ✅ **Risk & Alerts** - Monitor AI-detected risks and anomalies
- ✅ **Reports** - Generate evaluation and compliance reports
- ✅ **Settings** - Configure system settings
- ❌ **Users** - No access (admin only)

**Capabilities:**
- Create and publish tenders
- Run AI evaluations on bids
- View risk alerts and AI recommendations
- Generate reports
- Configure procurement settings

---

### 2. **APPROVING_AUTHORITY** (Approving Authority)
**Primary Role**: Approve tenders and finalize procurement decisions

**Access to Modules:**
- ✅ **Dashboard** - Full access to overview and statistics
- ✅ **Tenders** - View, approve, and delete tenders
- ✅ **Evaluations** - Review and approve bid evaluations
- ✅ **Risk & Alerts** - Review risk assessments
- ✅ **Reports** - Access all reports
- ✅ **Users** - Manage user accounts and permissions
- ✅ **Settings** - Configure system settings
- ✅ **ALL MODULES** - Highest access level

**Capabilities:**
- Approve and finalize tenders
- Delete tenders (soft delete/cancel)
- Approve bid evaluations
- Manage users and roles
- Access all reports and audit logs
- Configure system-wide settings

---

### 3. **EVALUATION_COMMITTEE** (Evaluation Committee)
**Primary Role**: Evaluate vendor bids and provide technical assessments

**Access to Modules:**
- ✅ **Dashboard** - Full access to overview and statistics
- ✅ **Tenders** - View tender details
- ✅ **Evaluations** - Full access to bid evaluation tools
- ✅ **Risk & Alerts** - Monitor evaluation-related risks
- ✅ **Reports** - Generate evaluation reports
- ❌ **Users** - No access
- ❌ **Settings** - No access

**Capabilities:**
- Evaluate vendor bids
- Run AI-powered evaluations
- Assign technical scores
- Review financial bids
- Generate evaluation reports
- Monitor risk alerts related to evaluations

---

### 4. **AUDITOR** (RTGS Auditor)
**Primary Role**: Audit procurement activities and ensure compliance

**Access to Modules:**
- ✅ **Dashboard** - Full access to overview and statistics
- ✅ **Tenders** - Read-only access to all tenders
- ✅ **Evaluations** - Read-only access to evaluations
- ✅ **Risk & Alerts** - Full access to all risk alerts
- ✅ **Reports** - Access all reports and audit logs
- ✅ **Users** - View user activities and audit trails
- ❌ **Settings** - No access (read-only role)

**Capabilities:**
- View all tenders and evaluations (read-only)
- Access comprehensive audit logs
- Review all risk alerts and AI decisions
- Generate audit reports
- Monitor user activities
- Ensure DPDP Act compliance
- Track AI recommendation usage

**Special Features:**
- Access to audit trail for all actions
- View AI confidence scores and explanations
- Monitor system compliance metrics

---

### 5. **VENDOR_VIEW** (Vendor View - Optional)
**Primary Role**: Limited read-only access for vendors

**Access to Modules:**
- ✅ **Dashboard** - Limited view (only published tenders)
- ❌ **Tenders** - No access to management features
- ❌ **Evaluations** - No access
- ❌ **Risk & Alerts** - No access
- ❌ **Reports** - No access
- ❌ **Users** - No access
- ❌ **Settings** - No access

**Capabilities:**
- View published tenders only
- See tender details and requirements
- Download RFP documents
- View closing dates

**Note**: This role is optional and typically not used in the internal system.

---

## 📊 Module Access Matrix

| Module | Procurement Officer | Approving Authority | Evaluation Committee | Auditor | Vendor View |
|--------|:------------------:|:-------------------:|:--------------------:|:-------:|:-----------:|
| **Dashboard** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Limited |
| **Tenders** | ✅ Create/Edit | ✅ Approve/Delete | ✅ View | ✅ View | ❌ |
| **Evaluations** | ✅ Run/View | ✅ Approve | ✅ Full | ✅ View | ❌ |
| **Risk & Alerts** | ✅ Monitor | ✅ Review | ✅ Monitor | ✅ Full | ❌ |
| **Reports** | ✅ Generate | ✅ All Reports | ✅ Generate | ✅ All Reports | ❌ |
| **Users** | ❌ | ✅ Manage | ❌ | ✅ View | ❌ |
| **Settings** | ✅ Configure | ✅ Configure | ❌ | ❌ | ❌ |

---

## 🔐 Implementation Details

### Frontend (React)
**File**: `src/components/DashboardLayout.tsx`

Each navigation item has a `roles` array that defines which user roles can access it:

```typescript
const navItems = [
  { 
    label: "Dashboard", 
    icon: LayoutDashboard, 
    path: "/dashboard",
    roles: ["PROCUREMENT_OFFICER", "APPROVING_AUTHORITY", "EVALUATION_COMMITTEE", "AUDITOR", "VENDOR_VIEW"]
  },
  { 
    label: "Users", 
    icon: Users, 
    path: "/dashboard/users",
    roles: ["APPROVING_AUTHORITY", "AUDITOR"]  // Only these roles can access
  },
  // ... more items
];
```

Navigation items are filtered based on the current user's role:
```typescript
navItems.filter((item) => item.roles.includes(auth.role))
```

### Backend (FastAPI)
**File**: `backend/routers/auth.py`

Role-based access control is enforced using the `require_role` decorator:

```python
@router.post("/tenders")
async def create_tender(
    current_user: User = Depends(require_role(
        UserRole.PROCUREMENT_OFFICER,
        UserRole.APPROVING_AUTHORITY
    ))
):
    # Only Procurement Officers and Approving Authorities can create tenders
    pass
```

---

## 🎯 Role Assignment Guidelines

### When to assign each role:

**PROCUREMENT_OFFICER**
- Department procurement officers
- Tender coordinators
- Procurement managers

**APPROVING_AUTHORITY**
- Department heads
- Financial controllers
- Senior officials with approval authority

**EVALUATION_COMMITTEE**
- Technical experts
- Subject matter specialists
- Evaluation panel members

**AUDITOR**
- RTGS audit team
- Compliance officers
- Internal auditors
- External auditors

**VENDOR_VIEW**
- Registered vendors (if public access is enabled)
- External stakeholders (limited use)

---

## 🔄 Role Switching (Demo Mode)

In the login page, users can select their role before logging in. The "Quick Demo" button allows instant access with the selected role for testing purposes.

**Demo Credentials:**
- Username: `demo`
- Password: `demo`
- Role: Select from dropdown

---

## 🛡️ Security Features

1. **Frontend Protection**
   - Navigation items hidden based on role
   - Routes protected with `ProtectedRoute` component
   - Role displayed in header for awareness

2. **Backend Protection**
   - All endpoints protected with JWT authentication
   - Role-based decorators on sensitive operations
   - Audit logging for all actions

3. **Audit Trail**
   - Every action logged with user role
   - Role changes tracked
   - Permission violations logged

---

## 📝 Testing Role-Based Access

### Test Scenarios:

1. **Login as Procurement Officer**
   - Should see: Dashboard, Tenders, Evaluations, Risks, Reports, Settings
   - Should NOT see: Users

2. **Login as Approving Authority**
   - Should see: ALL modules
   - Should have delete permissions on tenders

3. **Login as Evaluation Committee**
   - Should see: Dashboard, Tenders, Evaluations, Risks, Reports
   - Should NOT see: Users, Settings

4. **Login as Auditor**
   - Should see: Dashboard, Tenders, Evaluations, Risks, Reports, Users
   - Should have read-only access (no edit/delete)
   - Should NOT see: Settings

5. **Login as Vendor View**
   - Should see: Dashboard only (limited)
   - Should NOT see: Any other modules

---

## 🔧 Customizing Role Permissions

To modify role permissions, edit the `navItems` array in `src/components/DashboardLayout.tsx`:

```typescript
{ 
  label: "Your Module", 
  icon: YourIcon, 
  path: "/dashboard/your-module",
  roles: ["ROLE1", "ROLE2"]  // Add/remove roles here
}
```

And update the corresponding backend endpoint with the `require_role` decorator.

---

## 📚 Related Documentation

- **Authentication**: See `backend/routers/auth.py`
- **User Management**: See `backend/routers/users.py`
- **Audit Logging**: See `backend/middleware/audit_logger.py`
- **Frontend Auth**: See `src/lib/auth-context.tsx`

---

**Last Updated**: February 10, 2026  
**Version**: 1.0.0  
**System**: RTGS Procurement Management System
