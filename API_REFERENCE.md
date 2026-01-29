# API Reference - Complete Endpoint Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Endpoints

### 1. Register Employee
**POST** `/auth/signup`

**Request Body:**
```json
{
  "employeeId": "123456",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "department": "Engineering",
  "designation": "Software Engineer",
  "phoneNumber": "9876543210",
  "joiningDate": "2026-01-29"
}
```

**Response (201):**
```json
{
  "_id": "...",
  "employeeId": "123456",
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "designation": "Software Engineer",
  "role": "employee",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "hr@dmwcnc.com",
  "password": "DMWhr@2024"
}
```

**Response (200):**
```json
{
  "_id": "...",
  "employeeId": "HR001",
  "name": "HR Manager",
  "email": "hr@dmwcnc.com",
  "department": "Human Resources",
  "designation": "HR Manager",
  "role": "hr",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 3. Get Profile
**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "employeeId": "123456",
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "designation": "Software Engineer",
  "phoneNumber": "9876543210",
  "joiningDate": "2026-01-29T00:00:00.000Z",
  "role": "employee"
}
```

---

## Employee Endpoints (HR Only)

### 4. Get All Employees
**GET** `/employees`

**Headers:**
```
Authorization: Bearer <hr-token>
```

**Response (200):**
```json
[
  {
    "_id": "...",
    "employeeId": "123456",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering",
    "designation": "Software Engineer",
    "phoneNumber": "9876543210",
    "joiningDate": "2026-01-29T00:00:00.000Z",
    "role": "employee",
    "isActive": true,
    "createdAt": "2026-01-29T...",
    "updatedAt": "2026-01-29T..."
  }
]
```

---

### 5. Get Employee Statistics
**GET** `/employees/stats`

**Headers:**
```
Authorization: Bearer <hr-token>
```

**Response (200):**
```json
{
  "totalEmployees": 5,
  "activeEmployees": 4,
  "inactiveEmployees": 1,
  "departmentStats": [
    { "_id": "Engineering", "count": 3 },
    { "_id": "Sales", "count": 2 }
  ]
}
```

---

### 6. Get Employee by ID
**GET** `/employees/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "employeeId": "123456",
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "designation": "Software Engineer",
  "phoneNumber": "9876543210",
  "isActive": true,
  "role": "employee",
  "createdAt": "2026-01-29T...",
  "updatedAt": "2026-01-29T..."
}
```

---

### 7. Update Employee
**PUT** `/employees/:id`

**Headers:**
```
Authorization: Bearer <hr-token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "department": "Product",
  "designation": "Senior Engineer",
  "phoneNumber": "9999999999",
  "isActive": true
}
```

**Response (200):**
```json
{
  "_id": "...",
  "employeeId": "123456",
  "name": "John Updated",
  "email": "john@example.com",
  "department": "Product",
  "designation": "Senior Engineer",
  "phoneNumber": "9999999999",
  "role": "employee",
  "isActive": true
}
```

---

### 8. Delete Employee
**DELETE** `/employees/:id`

**Headers:**
```
Authorization: Bearer <hr-token>
```

**Response (200):**
```json
{
  "message": "Employee removed successfully"
}
```

---

## Leave Endpoints

### 9. Apply for Leave
**POST** `/leaves`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "leaveType": "Sick Leave",
  "startDate": "2026-02-01",
  "endDate": "2026-02-03",
  "numberOfDays": 3,
  "reason": "Medical checkup required"
}
```

**Response (201):**
```json
{
  "_id": "...",
  "employeeId": {
    "_id": "...",
    "employeeId": "123456",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering"
  },
  "leaveType": "Sick Leave",
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-02-03T00:00:00.000Z",
  "numberOfDays": 3,
  "reason": "Medical checkup required",
  "status": "Pending",
  "createdAt": "2026-01-29T...",
  "updatedAt": "2026-01-29T..."
}
```

---

### 10. Get All Leaves (HR)
**GET** `/leaves?status=Pending`

**Headers:**
```
Authorization: Bearer <hr-token>
```

**Query Parameters:**
- `status` (optional): Filter by status (Pending, Approved, Rejected)

**Response (200):**
```json
[
  {
    "_id": "...",
    "employeeId": {
      "_id": "...",
      "employeeId": "123456",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Engineering",
      "designation": "Software Engineer"
    },
    "leaveType": "Sick Leave",
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-02-03T00:00:00.000Z",
    "numberOfDays": 3,
    "reason": "Medical checkup required",
    "status": "Pending",
    "createdAt": "2026-01-29T...",
    "updatedAt": "2026-01-29T..."
  }
]
```

---

### 11. Get My Leaves
**GET** `/leaves/my-leaves`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "...",
    "leaveType": "Sick Leave",
    "startDate": "2026-02-01T00:00:00.000Z",
    "endDate": "2026-02-03T00:00:00.000Z",
    "numberOfDays": 3,
    "reason": "Medical checkup required",
    "status": "Approved",
    "hrComments": "Approved. Get well soon!",
    "approvedBy": {
      "_id": "...",
      "employeeId": "HR001",
      "name": "HR Manager"
    },
    "approvedDate": "2026-01-30T...",
    "createdAt": "2026-01-29T...",
    "updatedAt": "2026-01-30T..."
  }
]
```

---

### 12. Get Leave Statistics
**GET** `/leaves/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "totalLeaves": 10,
  "pendingLeaves": 3,
  "approvedLeaves": 6,
  "rejectedLeaves": 1,
  "leaveTypeStats": [
    { "_id": "Sick Leave", "count": 5 },
    { "_id": "Casual Leave", "count": 3 },
    { "_id": "Earned Leave", "count": 2 }
  ]
}
```

---

### 13. Get Leave by ID
**GET** `/leaves/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "employeeId": {
    "_id": "...",
    "employeeId": "123456",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering",
    "designation": "Software Engineer"
  },
  "leaveType": "Sick Leave",
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-02-03T00:00:00.000Z",
  "numberOfDays": 3,
  "reason": "Medical checkup required",
  "status": "Pending",
  "createdAt": "2026-01-29T...",
  "updatedAt": "2026-01-29T..."
}
```

---

### 14. Update Leave Status (HR)
**PUT** `/leaves/:id/status`

**Headers:**
```
Authorization: Bearer <hr-token>
```

**Request Body:**
```json
{
  "status": "Approved",
  "hrComments": "Approved. Get well soon!"
}
```

**Response (200):**
```json
{
  "_id": "...",
  "employeeId": {
    "_id": "...",
    "employeeId": "123456",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering"
  },
  "leaveType": "Sick Leave",
  "startDate": "2026-02-01T00:00:00.000Z",
  "endDate": "2026-02-03T00:00:00.000Z",
  "numberOfDays": 3,
  "reason": "Medical checkup required",
  "status": "Approved",
  "hrComments": "Approved. Get well soon!",
  "approvedBy": {
    "_id": "...",
    "employeeId": "HR001",
    "name": "HR Manager"
  },
  "approvedDate": "2026-01-29T...",
  "createdAt": "2026-01-29T...",
  "updatedAt": "2026-01-29T..."
}
```

---

### 15. Delete Leave
**DELETE** `/leaves/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Leave application deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid employee data"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. HR only."
}
```

### 404 Not Found
```json
{
  "message": "Employee not found"
}
```

### 500 Server Error
```json
{
  "message": "Error message details"
}
```

---

## Leave Types

Available leave types:
- Sick Leave
- Casual Leave
- Earned Leave
- Maternity Leave
- Paternity Leave
- Other

---

## Leave Status

Possible status values:
- **Pending**: Initial state when leave is applied
- **Approved**: Leave approved by HR
- **Rejected**: Leave rejected by HR

---

## Testing with cURL

### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@dmwcnc.com","password":"DMWhr@2024"}'
```

### Get Employees Example (with token)
```bash
curl -X GET http://localhost:5000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Apply Leave Example
```bash
curl -X POST http://localhost:5000/api/leaves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "leaveType": "Sick Leave",
    "startDate": "2026-02-01",
    "endDate": "2026-02-03",
    "numberOfDays": 3,
    "reason": "Medical checkup"
  }'
```

---

**Documentation Updated**: January 29, 2026
**API Version**: 1.0.0
**Status**: Production Ready
