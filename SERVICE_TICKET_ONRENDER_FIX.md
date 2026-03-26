# Service Ticket Creation Error - OnRender 500 Error Fix

## 🔴 Problem: 500 Internal Server Error When Creating Service Ticket

You're getting a **500 error** when trying to create a service ticket on your OnRender-hosted backend. This guide will help you diagnose and fix it.

---

## 🔍 Most Likely Causes (in order)

### 1. **Missing Cloudinary Environment Variables** ⚠️ (Most Common)
The service ticket creation requires Cloudinary for file uploads. If these variables are missing, the server crashes.

#### Solution:
Add these environment variables to OnRender:

1. Go to your OnRender dashboard
2. Select your backend service
3. Go to **Environment**
4. Add the following variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to get Cloudinary credentials:**
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up (free tier is fine)
3. Go to **Dashboard**
4. Copy your Cloud Name, API Key, and API Secret
5. Paste them in OnRender environment variables

---

### 2. **MongoDB Connection Issue**

#### Check if MongoDB is configured:
```env
MONGODB_URI=your_mongodb_connection_string
```

**Verify it's reachable from OnRender:**
```bash
# Test connection with mongosh or MongoDB Compass
# Use the same connection string you have in OnRender
mongosh "mongodb+srv://user:password@cluster.mongodb.net/database"
```

#### If using MongoDB Atlas:
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Find your connection string
- Add OnRender's IP to whitelist:
  - Network Access → Add IP Address
  - Add `0.0.0.0/0` (allows all - development only)
  - Or better: Add OnRender's IP specifically

---

### 3. **Authentication/Token Issue**

Make sure you're sending a valid token in the request header:

```bash
curl -X POST https://your-app.onrender.com/api/service-tickets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Ticket",
    "description": "Test Description",
    "priority": "Medium",
    "category": "Other"
  }'
```

---

## 🛠️ Troubleshooting Steps

### Step 1: Check OnRender Logs
1. Go to OnRender dashboard
2. Select your service
3. Click **Logs** tab
4. Look for the exact error message

**Common errors:**
- `CLOUDINARY_CLOUD_NAME is not defined` → Missing Cloudinary env vars
- `connection timeout` → MongoDB unreachable
- `Cannot read property 'split' of undefined` → Missing or invalid token

---

### Step 2: Test Backend Health
```bash
# Test if backend is running
curl https://your-app.onrender.com/

# Expected: Should show some response or 404, not 500
```

---

### Step 3: Create Service Ticket Without Files
If Cloudinary is the issue, try creating a ticket without file attachments first:

**Frontend**: Don't select any attachments
**Backend test**:
```bash
curl -X POST https://your-app.onrender.com/api/service-tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Ticket",
    "description": "Testing without files",
    "priority": "Medium",
    "category": "Other"
  }'
```

If this works, it confirms Cloudinary is the issue.

---

### Step 4: Test Cloudinary Configuration

Add this temporary endpoint to test Cloudinary (in `server.js`):

```javascript
// Add this route to test Cloudinary
app.get('/api/test-cloudinary', (req, res) => {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const config = cloudinary.config();
  const isConfigured = !!(config.cloud_name && config.api_key && config.api_secret);

  res.json({
    cloudinaryConfigured: isConfigured,
    cloudName: config.cloud_name ? 'SET' : 'MISSING',
    apiKey: config.api_key ? 'SET' : 'MISSING',
    apiSecret: config.api_secret ? 'SET' : 'MISSING',
  });
});
```

Then visit: `https://your-app.onrender.com/api/test-cloudinary`

**Expected response:**
```json
{
  "cloudinaryConfigured": true,
  "cloudName": "SET",
  "apiKey": "SET",
  "apiSecret": "SET"
}
```

---

## ✅ Complete Environment Variables Checklist

Your OnRender environment should have ALL of these:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster...

# Authentication
JWT_SECRET=your-secret-key-here

# Cloudinary (For file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# HR Credentials
HR_EMAIL=hr@company.com
HR_PASSWORD=SecurePassword123

# Node Environment
NODE_ENV=production
```

---

## 🚀 Step-by-Step Fix for OnRender

### 1. **Add Environment Variables**
Go to your service on OnRender:
- Settings → Environment
- Add all variables listed above
- Save and redeploy

### 2. **Redeploy Service**
- Go to **Deployments** tab
- Click **Clear Build Cache & Redeploy**
- Wait for deployment to complete

### 3. **Wait 2-3 Minutes**
OnRender services take time to cold-start. Wait after deployment.

### 4. **Test Again**
Try creating a service ticket again from your app.

---

## 🔧 Backend Code Fix (Optional)

If you want to make service ticket creation work WITHOUT file uploads initially, modify the code:

**File**: `backend/controllers/serviceTicketController.js`

### Option 1: Make file uploads optional (Recommended)

```javascript
// Make Cloudinary optional
const uploadToCloudinary = async (buffer, mimetype, filename) => {
  // Skip if Cloudinary not configured
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('Cloudinary not configured, skipping file upload');
    return null;
  }

  return new Promise((resolve, reject) => {
    // ... existing upload code
  });
};
```

### Option 2: Simplify error handling

```javascript
export const createServiceTicket = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;
    const createdBy = req.user._id;

    // Validate inputs
    if (!title?.trim() || !description?.trim() || !priority) {
      return res.status(400).json({ 
        message: 'Title, description, and priority are required' 
      });
    }

    // Create ticket WITHOUT file processing first
    const ticket = new ServiceTicket({
      title: title.trim(),
      description: description.trim(),
      priority,
      category: category || 'Other',
      createdBy,
      attachments: [],  // Empty for now
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    await ticket.save();
    const populatedTicket = await ticket.populate('createdBy', 'name email');

    res.status(201).json({ 
      message: 'Service ticket created successfully', 
      ticket: populatedTicket 
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ 
      message: 'Error creating ticket',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
```

---

## 📱 Quick Test from Frontend

**Edit `src/api/serviceTicketService.ts` to add error logging:**

```typescript
createTicket: async (ticketData: FormData) => {
  try {
    console.log('Creating ticket with:', Object.fromEntries(ticketData));
    const response = await axiosInstance.post(`${SERVICE_TICKETS_API}`, ticketData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Full error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
},
```

Then check **Browser Console** (F12) for detailed error messages.

---

## 📞 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `CLOUDINARY_CLOUD_NAME is not defined` | Missing env var | Add Cloudinary variables to OnRender |
| `MongoNetworkError` | DB not reachable | Check MongoDB whitelist IP |
| `Cannot read property 'split' of undefined` | Missing auth header | Send valid JWT token |
| `413 Payload Too Large` | File too big | Reduce file size (max 10MB) |
| `Failed to upload to Cloudinary` | API credentials wrong | Verify Cloudinary keys |

---

## ✅ Verification Checklist

After applying fixes:

- [ ] Added all environment variables to OnRender
- [ ] Redeployed backend
- [ ] Waited 2-3 minutes for cold start
- [ ] Checked OnRender logs for errors
- [ ] Tested `/api/test-cloudinary` endpoint
- [ ] Verified MongoDB connection with `mongosh`
- [ ] Cleared browser cache and localStorage
- [ ] Re-logged into the app to get fresh token
- [ ] Tried creating ticket WITHOUT attachments first
- [ ] Checked browser console (F12) for detailed errors

---

## 🚨 If Still Getting 500 Error

1. **Share detailed error from OnRender logs** - Go to Logs tab and copy the full error message
2. **Test with curl** - Run the curl commands above
3. **Check JWT token** - Make sure token is valid and not expired
4. **Test local backend** - Run `npm run dev` locally and test if it works

---

## 📝 Deployment Checklist for OnRender

```
Backend Setup:
✅ Push code to GitHub
✅ Connect GitHub to OnRender
✅ Set all 6 environment variables
✅ Set Node environment to production
✅ Add start script in package.json: "start": "node server.js"
✅ Set build command: "npm install"
✅ Deploy and wait 3-5 minutes
✅ Test endpoints with curl

Frontend Setup:
✅ Update API base URL to OnRender backend URL
✅ Build: npm run build
✅ Deploy to Vercel/Netlify/OnRender
✅ Test service ticket creation
```

---

**Status**: Follow these steps and your service ticket creation should work! 🎉
