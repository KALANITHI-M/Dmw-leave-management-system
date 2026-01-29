# 🚀 Quick Start Guide

## Prerequisites
- MongoDB installed and running
- Node.js and npm installed

## Starting the Application

### Option 1: Manual Start (Recommended for Development)

#### Terminal 1 - Start MongoDB (if not running as service)
```bash
# Windows
"C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe"

# Or if MongoDB is installed as a service
net start MongoDB
```

#### Terminal 2 - Start Backend
```bash
cd backend
npm install  # First time only
npm run dev
```
**Wait for**: `MongoDB Connected: localhost` and `Server running on port 5000`

#### Terminal 3 - Start Frontend
```bash
cd ionic-tutorial  # From project root
npm install  # First time only
npm run dev
```
**Wait for**: Dev server to start (usually on http://localhost:8100)

---

## Option 2: Using VS Code Terminals

1. **Open Terminal 1** (Backend):
   ```bash
   cd C:\Users\kalanithi\OneDrive\Documents\react ionic\firstIonicProject\ionic-tutorial\backend
   npm run dev
   ```

2. **Split Terminal** → **Open Terminal 2** (Frontend):
   ```bash
   cd C:\Users\kalanithi\OneDrive\Documents\react ionic\firstIonicProject\ionic-tutorial
   npm run dev
   ```

---

## ✅ Verification Checklist

### 1. Backend Running
- [ ] Terminal shows: `Server running in development mode on port 5000`
- [ ] Terminal shows: `MongoDB Connected: localhost`
- [ ] Visit http://localhost:5000 → Should see API welcome message

### 2. Frontend Running
- [ ] Terminal shows: `Local: http://localhost:8100`
- [ ] Browser opens automatically or visit http://localhost:8100
- [ ] No console errors about API connection

### 3. Test Connectivity
- [ ] Go to Signup page
- [ ] Fill in form (Employee ID: 6 digits, Phone: 10 digits)
- [ ] Click Sign Up
- [ ] Should redirect to dashboard (check browser console for errors)

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is already in use
netstat -ano | findstr :5000

# Kill the process using port 5000 (if needed)
taskkill /PID <PID> /F
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
tasklist | findstr mongod

# Start MongoDB service
net start MongoDB

# Or start manually
mongod
```

### Frontend API Errors
- Ensure backend is running first
- Check browser console for error details
- Verify `src/api/axios.ts` has correct URL: `http://localhost:5000/api`

---

## 🎯 Quick Test Accounts

### HR Login
- **Email**: hr@dmwcnc.com
- **Password**: DMWhr@2024

### Test Employee (Create via Signup)
- **Employee ID**: 123456
- **Name**: Test User
- **Email**: test@example.com
- **Password**: test123
- **Department**: Engineering
- **Designation**: Developer
- **Phone**: 9876543210
- **Joining Date**: 2026-01-29

---

## 📊 Port Usage

| Service   | Port | URL                          |
|-----------|------|------------------------------|
| Backend   | 5000 | http://localhost:5000        |
| Frontend  | 8100 | http://localhost:8100        |
| MongoDB   | 27017| mongodb://localhost:27017    |

---

**Tip**: Keep both terminals open while developing. Backend has hot-reload via nodemon, and frontend has Vite hot module replacement (HMR).
