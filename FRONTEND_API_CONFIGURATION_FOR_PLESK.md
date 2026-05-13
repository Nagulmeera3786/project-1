# Frontend API Configuration for Plesk

This guide explains the `.env.production` file and how React communicates with the Django backend on Plesk.

## ✅ What Was Added

A new file: `frontend/.env.production` with:
```env
REACT_APP_USE_SAME_ORIGIN_API=true
REACT_APP_ALLOW_PRODUCTION_API_FALLBACK=true
```

This configuration is required for production builds when deploying to Plesk.

---

## 🔍 Understanding the Configuration

### Why This Matters

Your React frontend and Django backend run on the **same domain** in Plesk:

```
https://yourdomain.com/
    ├── Frontend UI (React) → Served from root
    └── Backend API → At /api/ endpoint
```

The `.env.production` file tells React where to find the API:

| Setting | Meaning |
|---------|---------|
| `REACT_APP_USE_SAME_ORIGIN_API=true` | Use same domain for API (no CORS issues) |
| `REACT_APP_ALLOW_PRODUCTION_API_FALLBACK=true` | Allow fallback if primary fails |

### API Endpoints Configuration

The React frontend looks for API at:

```javascript
// When REACT_APP_USE_SAME_ORIGIN_API=true:
API_URL = "https://yourdomain.com/api/auth/"

// Instead of:
API_URL = "https://separate-api-domain.com/api/auth/"
```

This is perfect for Plesk because:
- ✅ No CORS headers needed (same domain)
- ✅ Cookies work automatically
- ✅ Simplified security model
- ✅ Better performance (no cross-origin overhead)

---

## 🔧 Build Process

### During Development (npm start)
```bash
cd frontend
npm start
```
- Runs on `http://localhost:3000`
- Makes API calls to `http://localhost:8000` (dev backend)
- Uses development configuration

### During Production Build (npm run build)
```bash
cd frontend
npm run build
```
- Checks for `.env.production` file
- Uses `REACT_APP_USE_SAME_ORIGIN_API=true`
- Creates optimized build in `frontend/build/`
- Build verifies API configuration before proceeding

### Verification Script Flow

```
npm run build
    ↓
node scripts/verify-deploy-env.js (checks env)
    ↓
Looks for REACT_APP_USE_SAME_ORIGIN_API=true
    ↓
✅ Configuration valid → Continues build
❌ Configuration missing → Stops with error
```

---

## 📁 Environment Files Explained

### `.env.development` (Optional)
Used when running `npm start`:
```env
REACT_APP_USE_SAME_ORIGIN_API=false
REACT_APP_API_BASE_URL=http://localhost:8000/api/auth/
```

### `.env.production` (Already Created)
Used when running `npm run build`:
```env
REACT_APP_USE_SAME_ORIGIN_API=true
REACT_APP_ALLOW_PRODUCTION_API_FALLBACK=true
```

### `.env` (Gitignored)
Local overrides (not committed to git):
```env
# Can override anything here for local testing
REACT_APP_API_BASE_URL=http://192.168.1.50:8000/api/auth/
```

---

## 🚀 Building for Plesk

### Local Build (Before Upload)
```bash
cd frontend
npm install
npm run build
```

Expected output:
```
✓ Successfully compiled
✓ Build directory created at: frontend/build/
✓ Ready to upload to Plesk
```

### Build Error Solutions

**Error: "Missing frontend API configuration for production build"**

**Solution 1:** Ensure `.env.production` exists
```bash
ls -la frontend/.env.production  # Should exist
cat frontend/.env.production     # Should show REACT_APP_USE_SAME_ORIGIN_API=true
```

**Solution 2:** Set environment variable manually
```bash
cd frontend
REACT_APP_USE_SAME_ORIGIN_API=true npm run build
```

**Solution 3:** Check script permissions
```bash
chmod +x frontend/scripts/verify-deploy-env.js
```

---

## 🔌 How React Calls the API

### In Development
```javascript
// frontend/src/api.js
const API_BASE_URL = 'http://localhost:8000/api/auth/'

// API call:
axios.post(`${API_BASE_URL}login/`, { username, password })
```

### In Production (Plesk)
```javascript
// .env.production has: REACT_APP_USE_SAME_ORIGIN_API=true
// So React uses:
const API_BASE_URL = 'https://yourdomain.com/api/auth/'

// API call:
axios.post(`${API_BASE_URL}login/`, { username, password })
// Same as: https://yourdomain.com/api/auth/login/
```

### Request Flow on Plesk

```
1. User types: https://yourdomain.com/login
2. React loads from: https://yourdomain.com/
3. User clicks "Login"
4. React calls: https://yourdomain.com/api/auth/login/
5. Apache/Nginx sees /api/ in URL
6. Routes to Django at: 127.0.0.1:8000
7. Django returns login response
8. React stores session and redirects to dashboard
```

---

## 🔐 Security Considerations

### Why Same-Origin API is Better for Plesk

✅ **Advantages:**
- CORS headers not needed
- Simpler security model
- No cross-site attack vectors
- Cookies work automatically
- Session management simplified

❌ **When You Might Need CORS:**
- Backend on different domain (api.domain.com vs www.domain.com)
- Microservices architecture
- CDN for static assets on different domain

---

## 📋 API Endpoint Configuration Checklist

For Plesk deployment, ensure:

- [x] `.env.production` file exists
- [x] `REACT_APP_USE_SAME_ORIGIN_API=true` is set
- [x] `npm run build` completes without errors
- [x] `frontend/build/` folder is generated
- [ ] Upload `frontend/build/` to Plesk `public_html/`
- [ ] Configure `ALLOWED_HOSTS` in `backend/project/settings.py`
- [ ] Configure `CORS_ALLOWED_ORIGINS` in `.env` on Plesk server
- [ ] Test API calls from React frontend

---

## 🧪 Testing the Configuration

### Local Testing
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Verify build folder
ls -la frontend/build/index.html  # Should exist

# 3. Check build output
cat frontend/build/index.html | grep "React" | head -5
```

### On Plesk Server
```bash
# 1. Verify React files uploaded
ls -la /path/to/public_html/index.html

# 2. Check API calls work
curl https://yourdomain.com/api/auth/
# Should return API endpoints (not 404 or CORS error)

# 3. Test in browser
# Visit: https://yourdomain.com/
# Open Developer Console (F12)
# Should see NO CORS errors
# Check Network tab - API calls should work
```

---

## 🐛 Troubleshooting

### Build Fails with "Missing frontend API configuration"

```bash
# Ensure .env.production exists and is readable
file frontend/.env.production
cat frontend/.env.production

# Should show:
# REACT_APP_USE_SAME_ORIGIN_API=true

# If missing, create it:
echo "REACT_APP_USE_SAME_ORIGIN_API=true" > frontend/.env.production

# Try building again:
cd frontend && npm run build
```

### API Calls Get CORS Errors

```bash
# 1. Check backend CORS settings
# In .env on Plesk server:
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 2. Verify in backend/project/settings.py:
# CORS_ALLOWED_ORIGINS should include your domain

# 3. Restart Django:
sudo systemctl restart django-abc
```

### React Calls Wrong API URL

```javascript
// Check what URL React is using:
// In browser console (F12):
console.log(process.env.REACT_APP_USE_SAME_ORIGIN_API)
// Should show: true

// Check API base URL:
console.log(window.location.origin + '/api/auth/')
// Should show: https://yourdomain.com/api/auth/
```

---

## 📚 Environment Variables Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `REACT_APP_USE_SAME_ORIGIN_API` | `true` | Use same domain for API (Plesk) |
| `REACT_APP_API_BASE_URL` | `https://yourdomain.com/api/auth/` | Explicit API URL |
| `REACT_APP_API_URL` | `https://yourdomain.com/api/auth/` | Alias for above |
| `REACT_APP_API_HOST` | `api.yourdomain.com` | API subdomain |
| `REACT_APP_ALLOW_PRODUCTION_API_FALLBACK` | `true` | Fallback if primary fails |

---

## ✨ Next Steps

1. ✅ `.env.production` file has been created
2. ✅ Build frontend: `cd frontend && npm run build`
3. ✅ Upload `frontend/build/` to Plesk
4. ✅ Configure backend `.env` on Plesk server
5. ✅ Test API calls from React frontend

---

## 📖 Related Files

- [PLESK_DEPLOYMENT_GUIDE.md](PLESK_DEPLOYMENT_GUIDE.md) - Main deployment guide
- [DJANGO_SETTINGS_FOR_PLESK.md](DJANGO_SETTINGS_FOR_PLESK.md) - Backend configuration
- [PLESK_QUICK_COMMANDS.md](PLESK_QUICK_COMMANDS.md) - Command reference

---

**Version:** 1.0  
**Updated:** May 7, 2026  
**Status:** ✅ Ready to use
