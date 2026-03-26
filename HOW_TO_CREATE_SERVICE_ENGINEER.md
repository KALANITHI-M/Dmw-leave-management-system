# How to Create a Service Engineer Account

This guide explains all the methods to create and configure a Service Engineer user in the Leave & Service Ticket Management System.

---

## 📋 Overview

A **Service Engineer** is a specialized role that:
- ✅ Works on assigned service tickets
- ✅ Can update ticket status and upload proof of work
- ✅ Can view only tickets assigned to them
- ✅ Cannot create new service tickets
- ✅ Cannot assign tickets to others

**Role Definition**: `service engineer`

---

## 🔧 Method 1: HR Changes Employee Role (Recommended for Current System)

### Step 1: Create Account as Regular Employee
1. The person signs up normally on the app:
   - Go to **Signup** page
   - Fill in all details:
     - Employee ID: `123456` (6 digits)
     - Name: `John Engineer`
     - Email: `john.engineer@company.com`
     - Password: `SecurePass123`
     - Department: `Technical Support`
     - Designation: `Service Engineer`
     - Phone: `9876543210`
     - Joining Date: Select appropriate date
   - Click **Signup**
   - Account created with role: **employee**

### Step 2: HR Promotes to Service Engineer
1. HR logs in to the system:
   - Email: (HR email from environment)
   - Password: (HR password from environment)

2. Navigate to **Employee Management** (if available) or use backend API:

#### Option A: Using Backend API (Direct Method)
**Endpoint**: `PUT /api/employees/{employeeId}`
**Headers**: `Authorization: Bearer {HR_TOKEN}`

**Request Body**:
```json
{
  "role": "service engineer"
}
```

**Example using curl**:
```bash
curl -X PUT http://localhost:5000/api/employees/63f7d8b9c0d1e2f3g4h5i6j7 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"role": "service engineer"}'
```

**Response**:
```json
{
  "_id": "63f7d8b9c0d1e2f3g4h5i6j7",
  "employeeId": "123456",
  "name": "John Engineer",
  "email": "john.engineer@company.com",
  "department": "Technical Support",
  "designation": "Service Engineer",
  "phoneNumber": "9876543210",
  "role": "service engineer",
  "isActive": true
}
```

#### Option B: Using MongoDB Directly
```javascript
// In MongoDB shell or Compass
db.employees.updateOne(
  { _id: ObjectId("63f7d8b9c0d1e2f3g4h5i6j7") },
  { $set: { role: "service engineer" } }
)
```

---

## 🖥️ Method 2: Create Service Engineer via Backend Signup (Future Enhancement)

### For developers: Add role selection to signup form

**Current signup in `authController.js`**:
```javascript
role: 'employee',  // Always sets to 'employee'
```

**Enhanced version (requires HR authentication)**:
```javascript
export const signupServiceEngineer = async (req, res) => {
  try {
    // Verify HR authentication
    if (req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Only HR can create service engineers' });
    }

    const { employeeId, name, email, password, department, designation, phoneNumber, joiningDate, role } = req.body;

    // Validate role
    if (!['employee', 'service engineer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Use "employee" or "service engineer"' });
    }

    const employeeExists = await Employee.findOne({ $or: [{ email }, { employeeId }] });

    if (employeeExists) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    const employee = await Employee.create({
      employeeId,
      name,
      email,
      password,
      department,
      designation,
      phoneNumber,
      joiningDate,
      role: role || 'employee', // HR can specify role
    });

    if (employee) {
      res.status(201).json({
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        token: generateToken(employee._id, employee.role),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

---

## 🗄️ Method 3: Direct Database Insertion (Development Only)

### Creating Service Engineer directly in MongoDB

```javascript
// Insert a new service engineer user
db.employees.insertOne({
  employeeId: "654321",
  name: "Jane Engineer",
  email: "jane.engineer@company.com",
  password: "$2a$10$...", // Must be bcrypt hashed
  department: "Technical Support",
  designation: "Senior Service Engineer",
  phoneNumber: "9876543211",
  joiningDate: new Date("2024-01-15"),
  role: "service engineer",  // ← Set role directly
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Note**: Password must be bcrypt hashed. To hash a password:
```javascript
const bcrypt = require('bcryptjs');
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash('SecurePass123', salt);
console.log(hashedPassword);
// Use the output hash in the insert
```

---

## ✅ Testing Your Service Engineer Account

### 1. Verify Account Creation
```bash
# Get all employees (as HR)
curl -X GET http://localhost:5000/api/employees \
  -H "Authorization: Bearer {HR_TOKEN}"
```

### 2. Login as Service Engineer
In the app:
1. Go to **Login** page
2. Email: `john.engineer@company.com`
3. Password: `SecurePass123`
4. Click **Login**

### 3. Verify Service Engineer Features
- ✅ Dashboard shows "My Assigned Tickets"
- ✅ Simplified statistics (only assigned/in progress/resolved)
- ✅ No "Create Service Ticket" button
- ✅ Cannot access `/create-service-ticket` page
- ✅ Can only see assigned tickets
- ✅ Can update ticket status
- ✅ Can upload proof of work

### 4. Sample Test Case
```
User: john.engineer@company.com
Role: service engineer

Expected Behavior:
✅ Logs in successfully
✅ Dashboard title: "My Assigned Tickets"
✅ FAB button is HIDDEN
✅ "New Ticket" header button is HIDDEN
✅ Only sees 2-3 tickets assigned to them
✅ Can click on assigned ticket and update status
✅ Can upload proof files
❌ Cannot click create ticket
❌ Cannot see internal HR comments
❌ Cannot assign tickets
```

---

## 🔑 Important Notes

### Environment Variables (HR Access)
The HR account credentials are set via environment variables:
```env
HR_EMAIL=hr@company.com
HR_PASSWORD=AdminPass123
```

These must be set in your `.env` file for HR login to work.

### Role Values
The system supports exactly three roles:
- `'employee'` - Regular employee, can create tickets
- `'hr'` - HR staff, full management access
- `'service engineer'` - Field staff, work on assigned tickets

Any other value will be rejected by role validation.

### Database Role Field
In MongoDB, service engineers are stored with:
```json
{
  "role": "service engineer"
}
```

**Not** `"service-engineer"`, `"serviceEngineer"`, or any other variation.

---

## 🔄 Complete Workflow: From Employee to Service Engineer

```
┌─────────────────────────────────────────────────────┐
│ 1. New Officer Signs Up                              │
│    - Role: "employee" (default)                       │
│    - Can create tickets                              │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 2. HR Reviews and Promotes                           │
│    - HR updates user: role = "service engineer"      │
│    - Change happens via API or Database              │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 3. Service Engineer Logs In                          │
│    - Dashboard shows "My Assigned Tickets"           │
│    - Simplified interface for field work             │
│    - Can only work on assigned tickets               │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 4. Service Engineer Works                            │
│    - Updates ticket status                           │
│    - Uploads proof of work                           │
│    - Adds comments/notes                             │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference: Creating Service Engineer

### Fastest Method (for existing employee):
```bash
# 1. Get employee ID from database
db.employees.findOne({ email: "employee@company.com" })
# Result: "_id": "63f7d8b9c0d1e2f3g4h5i6j7"

# 2. Update role
db.employees.updateOne(
  { _id: ObjectId("63f7d8b9c0d1e2f3g4h5i6j7") },
  { $set: { role: "service engineer" } }
)

# 3. Done! User can now log in as Service Engineer
```

### Manual API Method:
```bash
curl -X PUT http://localhost:5000/api/employees/{employeeId} \
  -H "Authorization: Bearer {HR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"role": "service engineer"}'
```

---

## 📊 Comparison: Roles in the System

| Feature | Employee | Service Engineer | HR |
|---------|----------|------------------|-----|
| Create Tickets | ✅ | ❌ | ✅ |
| View Own Tickets | ✅ | N/A | ✅ All |
| View Assigned Tickets | ✅ | ✅ | ✅ All |
| Update Status | ✅ | ✅ | ✅ |
| Upload Proof | ❌ | ✅ | ❌ |
| Assign Tickets | ❌ | ❌ | ✅ |
| Close Tickets | ❌ | ❌ | ✅ |
| Internal Comments | ❌ | ❌ | ✅ |
| Create/Edit Events | ✅ | ❌ | ✅ |
| Manage Leaves | ✅ | ❌ | ✅ |
| View Reports | ❌ | ❌ | ✅ |

---

## ⚠️ Troubleshooting

### Issue: Service Engineer can create tickets
**Solution**: Check user's role in database
```javascript
db.employees.findOne({ email: "user@company.com" })
// Verify: "role": "service engineer"
```

### Issue: Service Engineer can see unassigned tickets
**Solution**: Backend filters not working, check:
```javascript
// In serviceTicketController.js
if (userRole === 'service engineer') {
  filters = { assignedTo: userId }; // Must be present
}
```

### Issue: Login fails after role change
**Solution**: 
- Clear browser cache/localStorage
- Log out and log in again
- Token is cached, new role takes effect on fresh login

### Issue: Cannot update HR credentials
**Solution**: HR credentials are hardcoded in environment:
```env
# .env file
HR_EMAIL=hr@company.com
HR_PASSWORD=YourSecurePassword
```
Change these and restart backend server.

---

## 🚀 Future Enhancement Ideas

1. **HR Admin Panel** - UI for role management
2. **Bulk Import** - Create multiple service engineers from CSV
3. **Role-Based Dashboard** - Different views for each role
4. **Approval Workflow** - Service engineers need approval to change status
5. **Performance Metrics** - Track engineer productivity

---

## 📝 Checklist for Creating Service Engineer

- [ ] Generate employee ID (6 digits)
- [ ] Create email address
- [ ] Set secure password
- [ ] Assign to department and designation
- [ ] Record joining date
- [ ] Create account (signup as employee OR direct DB insert)
- [ ] Change role to "service engineer"
- [ ] Test login
- [ ] Verify dashboard shows correct title
- [ ] Test ticket assignment
- [ ] Verify proof upload works
- [ ] Confirm access restrictions

---

**Status**: ✅ Ready to create Service Engineers

Use Method 1 (HR Promotes Employee) for the best UX and auditability.
