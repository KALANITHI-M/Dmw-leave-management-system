# Backend-Frontend Connectivity Guide

## ✅ Current Configuration Status

### Backend Configuration
- **Server Port**: 5000
- **Base URL**: `http://localhost:5000`
- **API Base**: `http://localhost:5000/api`
- **Database**: MongoDB on `mongodb://localhost:27017/dmw_leave_management`
- **CORS**: Enabled for all origins

### Frontend Configuration
- **API Base URL**: `http://localhost:5000/api` (configured in `src/api/axios.ts`)
- **Authentication**: JWT token stored in localStorage
- **Auto token injection**: Configured via axios interceptor

## 🔗 API Endpoints

### Authentication Routes (`/api/auth`)
1. **POST /api/auth/signup** - Register new employee
   - Body: `{ employeeId, name, email, password, department, designation, phoneNumber, joiningDate }`
   - Returns: User object with JWT token

2. **POST /api/auth/login** - Login employee/HR
   - Body: `{ email, password }`
   - Returns: User object with JWT token

3. **GET /api/auth/profile** - Get current user profile (protected)
   - Headers: `Authorization: Bearer <token>`
   - Returns: User profile data

## 📋 Validation Rules

### Frontend Validation (Signup.tsx)
- **Employee ID**: Exactly 6 digits (numeric only)
- **Password**: Minimum 6 characters
- **Confirm Password**: Must match password
- **Phone Number**: Exactly 10 digits
- **All fields**: Required (no empty fields)

### Backend Validation
- **Employee ID**: Must be unique
- **Email**: Must be unique and valid format
- **Password**: Minimum 6 characters (hashed with bcryptjs)

## 🔐 HR Credentials (Predefined)
- **Email**: hr@dmwcnc.com
- **Password**: DMWhr@2024
- **Employee ID**: HR001 (auto-created on first login)

## 📂 Key Files

### Backend Files
```
backend/
├── server.js                    # Main server file with Express setup
├── .env                         # Environment variables
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   └── authController.js        # Auth logic (signup, login, getProfile)
├── routes/
│   └── authRoutes.js            # Auth routes
├── models/
│   └── Employee.js              # Employee schema
├── middleware/
│   └── auth.js                  # JWT authentication middleware
└── utils/
    └── jwt.js                   # JWT token generation
```

### Frontend Files
```
src/
├── api/
│   ├── axios.ts                 # Axios instance with interceptors
│   └── authService.ts           # Auth API calls
├── context/
│   └── AuthContext.tsx          # Auth state management
├── pages/
│   ├── Login.tsx                # Login page
│   ├── Signup.tsx               # Signup page (UPDATED)
│   ├── EmployeeDashboard.tsx    # Employee dashboard
│   └── HRDashboard.tsx          # HR dashboard
└── types/
    └── index.ts                 # TypeScript types
```

## 🚀 How to Start

### 1. Start MongoDB
```bash
# Make sure MongoDB is running on localhost:27017
# Windows: Start MongoDB service or run mongod.exe
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

### 2. Start Backend Server
```bash
cd backend
npm install  # First time only
npm run dev  # Development mode with nodemon
```
Expected output:
```
Server running in development mode on port 5000
MongoDB Connected: localhost
```

### 3. Start Frontend
```bash
cd ionic-tutorial  # From project root
npm install  # First time only
npm run dev  # or ionic serve
```

## 🔄 Data Flow

### Signup Flow
```
1. User fills form in Signup.tsx
2. Frontend validates (6-digit ID, 10-digit phone, password match)
3. authService.signup(formData) → POST /api/auth/signup
4. Backend validates & checks for duplicates
5. Backend hashes password with bcrypt
6. Backend creates Employee document in MongoDB
7. Backend returns user data + JWT token
8. Frontend stores token in localStorage
9. Frontend auto-logins user (AuthContext)
10. Navigate to dashboard based on role
```

### Login Flow
```
1. User enters email/password in Login.tsx
2. authService.login({ email, password }) → POST /api/auth/login
3. Backend checks if HR credentials (predefined)
4. Backend finds employee and compares hashed password
5. Backend returns user data + JWT token
6. Frontend stores in localStorage
7. Navigate to dashboard based on role
```

### Protected Route Access
```
1. User navigates to protected route
2. axios interceptor adds token from localStorage
3. Backend middleware (protect) verifies JWT
4. If valid: proceed, if invalid: 401 error
```

## ✅ Updates Made

### Signup.tsx Changes
1. ✅ Imported `authService` and `useAuth`
2. ✅ Connected to backend API via `authService.signup()`
3. ✅ Added Employee ID validation (6 digits)
4. ✅ Added phone number validation (10 digits)
5. ✅ Added inputmode="numeric" and maxlength constraints
6. ✅ Auto-login after successful signup
7. ✅ Navigate to correct dashboard based on role
8. ✅ Display backend error messages
9. ✅ Toast color based on success/error

### Existing Backend-Frontend Connections
- ✅ CORS enabled in backend
- ✅ JWT token generation and verification
- ✅ Axios interceptor for auto token injection
- ✅ AuthContext for state management
- ✅ Protected routes with middleware
- ✅ Error handling on both sides

## 🧪 Testing the Connection

### Test 1: Backend Health Check
```bash
# Open browser or use curl
curl http://localhost:5000
# Should return: {"message": "DMW CNC Solutions - Leave Management System API"}
```

### Test 2: Signup
1. Open app in browser
2. Go to Signup page
3. Fill form with valid data:
   - Employee ID: 123456 (6 digits)
   - Phone: 9876543210 (10 digits)
   - Password: minimum 6 chars
4. Submit
5. Should auto-login and redirect to dashboard

### Test 3: Login with HR
1. Go to Login page
2. Enter:
   - Email: hr@dmwcnc.com
   - Password: DMWhr@2024
3. Should redirect to HR Dashboard

## ⚠️ Common Issues & Solutions

### Issue 1: Connection Refused
**Error**: `ERR_CONNECTION_REFUSED` or `Network Error`
**Solution**: 
- Ensure backend is running on port 5000
- Check if another process is using port 5000
- Verify API_BASE_URL in `src/api/axios.ts`

### Issue 2: MongoDB Connection Failed
**Error**: `MongoServerError: connect ECONNREFUSED`
**Solution**:
- Start MongoDB service
- Verify MONGODB_URI in backend/.env
- Check MongoDB is running on port 27017

### Issue 3: CORS Error
**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`
**Solution**:
- Already configured in server.js with `app.use(cors())`
- If still occurs, update to: `app.use(cors({ origin: 'http://localhost:8100' }))`

### Issue 4: Token Not Sent
**Error**: Protected routes return 401
**Solution**:
- Check localStorage has 'user' item with token
- Verify axios interceptor is configured
- Check token format: "Bearer <token>"

### Issue 5: Duplicate Key Error
**Error**: `E11000 duplicate key error`
**Solution**:
- Employee ID or Email already exists
- Try different Employee ID
- Check MongoDB for existing records

## 🔒 Security Notes

1. **JWT Secret**: Change `JWT_SECRET` in `.env` for production
2. **Password Hashing**: bcryptjs with salt rounds (automatic)
3. **Token Storage**: localStorage (consider httpOnly cookies for production)
4. **CORS**: Currently allows all origins (restrict in production)
5. **Environment Variables**: Never commit `.env` to version control

## 📱 Next Steps

1. ✅ Backend-Frontend connectivity established
2. ✅ Signup form validation and API integration complete
3. ⏭️ Test leave management features
4. ⏭️ Add more protected routes
5. ⏭️ Implement leave request functionality
6. ⏭️ Add error boundary components
7. ⏭️ Set up production environment

---

**Last Updated**: January 29, 2026
**Status**: ✅ All connections configured and ready to use
