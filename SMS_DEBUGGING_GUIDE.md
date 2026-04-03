# SMS Feature - Debugging & Troubleshooting Guide

## 🔧 Fixed Issues

The following issues have been fixed:

### 1. **Credentials Save Failure**
**Problem:** SMSCredentialView was failing when saving credentials
**Root Cause:** `RetrieveUpdateAPIView` expected object existence, but credentials might not exist
**Fix:** Rewrote view as GenericAPIView with explicit GET/PATCH methods that handle creation

### 2. **Frontend Error Handling**
**Problem:** Frontend wasn't displaying API error messages properly
**Root Cause:** Error response wasn't being parsed correctly
**Fix:** Added detailed error logging and comprehensive error message parsing

### 3. **Database Q Import**
**Problem:** `models.Q` was referenced before import
**Root Cause:** Q object was imported at end of file, not at top
**Fix:** Moved Q import to top of file with other imports

---

## ✅ Testing the Fix

### Option 1: Run Comprehensive Test
```bash
cd backend
python test_sms_complete.py
```

This will:
1. Create/verify admin user
2. Create/verify test user
3. Test admin login
4. Test GET credentials
5. Test PATCH (save) credentials ⭐
6. Verify credentials in database
7. Test SMS send
8. Test message retrieval
9. Test user eligibility toggle
10. Test admin users list

### Option 2: Manual Testing
1. Start backend: `python manage.py runserver`
2. Start frontend: `npm start`
3. Login as: `mrm53451@gmail.com / AdminSMS123!`
4. Go to: `/admin/sms/credentials`
5. Fill form and click "Save"
6. Should see: "✓ SMS Credentials saved successfully!"

---

## 🔍 If Still Having Issues

### Check 1: Database Migration
```bash
python manage.py migrate
python manage.py showmigrations accounts
```

Should show `0002_sms_models` as applied (✓)

### Check 2: Server Logs
Run backend with verbose output:
```bash
python manage.py runserver --verbosity 3
```

Watch for:
- 400 errors: Validation failed (check field requirements)
- 500 errors: Server exception (check traceback)
- 403 errors: Permission denied (check is_staff flag)

### Check 3: API Direct Test
```bash
# Get JWT token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"mrm53451@gmail.com","password":"AdminSMS123!"}'

# Copy the "access" token and use it:
curl -X GET http://localhost:8000/api/auth/sms/credentials/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Save credentials
curl -X PATCH http://localhost:8000/api/auth/sms/credentials/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user":"test_profile",
    "password":"test_pass",
    "sender_ids":["ABC"]
  }'
```

### Check 4: Browser Console Errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try saving credentials
4. Look for error messages with red icons
5. Copy error text and check server logs

### Check 5: Database State
```bash
python manage.py shell
```

```python
from accounts.models import SMSCredential, User
User.objects.filter(email='mrm53451@gmail.com').first()  # Check admin
SMSCredential.objects.all()  # Check credentials
SMSCredential.objects.filter(is_active=True).first()  # Check active
```

---

## 📋 Common Error Messages & Fixes

### Error: "Profile ID is required"
**Cause:** Empty Profile ID field
**Fix:** Fill "Profile ID (User)" field with your MSHastra profile ID

### Error: "Password is required"
**Cause:** Empty password field
**Fix:** Fill "Password / API Key" field

### Error: "At least one sender ID is required"
**Cause:** Empty sender IDs
**Fix:** Add at least one sender ID (e.g., "ABC" or "ABC, TEST")

### Error: "Admin only"
**Cause:** Logged-in user is not staff/admin
**Fix:** 
```bash
python manage.py shell
from accounts.models import User
u = User.objects.get(email='mrm53451@gmail.com')
u.is_staff = True
u.is_superuser = True
u.save()
```

### Error: "Invalid sender ID"
**Cause:** Sender ID in form doesn't match saved credentials
**Fix:** The dropdown should auto-populate. If empty:
1. Verify credentials were saved
2. Manually enter sender ID if dropdown empty
3. Reload page after saving

### Error: 500 Internal Server Error on Save
**Cause:** Unhandled exception in backend
**Fix:**
1. Check server logs for traceback
2. Ensure all required fields filled
3. Restart backend: `python manage.py runserver`

---

## 🔄 Reset & Retry

If everything fails, do a complete reset:

```bash
# 1. Delete old credentials from database
python manage.py shell
from accounts.models import SMSCredential
SMSCredential.objects.all().delete()
exit()

# 2. Restart backend
python manage.py runserver

# 3. Try saving credentials again
```

Or via Django shell:
```python
from accounts.models import SMSCredential
# Clear all
SMSCredential.objects.all().delete()
# Create fresh
SMSCredential.objects.create(
    user='your_profile_id',
    password='your_password',
    sender_ids=['ABC', 'TEST'],
    is_active=True
)
```

---

## 📊 Expected Behavior After Fix

### When Adding Credentials:
1. Fill form with Profile ID, Password, Sender IDs
2. Click "Save Credentials"
3. See green success message: "✓ SMS Credentials saved successfully!"
4. Form closes
5. Credentials display on page (password masked)
6. Sender ID dropdown populated on `/sms/send`

### When Editing Credentials:
1. Click "Edit Credentials" button
2. Form reopens with current values
3. Password field empty (for security)
4. Update fields as needed
5. Click "Save Credentials"
6. See success message
7. Updated values displayed

### Test SMS Send:
1. Go to `/sms/send`
2. Sender ID dropdown shows: TEST, ABC, DEMO
3. Fill message and number
4. Click "Send SMS"
5. Should see "SMS sent successfully! Message ID: ..."

---

## 🐛 Debug Logging

### Enable Frontend Logging
In `AdminSMSCredentials.js`, look for `console.log()` statements:
```javascript
console.log('Sending payload:', payload);
console.log('Save response:', response.data);
console.error('Error details:', err);
```

Check browser console (F12) for these logs.

### Enable Backend Logging
In `sms_views.py`, exceptions are caught and returned with details:
```python
except Exception as e:
    return Response(
        {'detail': f'Error saving credentials: {str(e)}'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
```

Server logs will show full traceback.

---

## 📞 Quick Checklist Before Reporting Issue

- [ ] Database migrated: `python manage.py migrate`
- [ ] Admin user created: `python setup_sms.py`
- [ ] Backend running: `python manage.py runserver`
- [ ] Frontend running: `npm start`
- [ ] Logged in as: mrm53451@gmail.com
- [ ] Server logs showing no errors (run with `--verbosity 3`)
- [ ] Browser console (F12) has no red errors
- [ ] Tried test script: `python test_sms_complete.py`
- [ ] Database has SMSCredential table: `python manage.py shell → from accounts.models import SMSCredential`
- [ ] Can access other admin pages (e.g., `/admin/users`)

---

## 📝 Support Info to Provide

If you need to report an issue, include:

1. **Server Log Output** (with --verbosity 3):
   ```
   [exact error messages]
   ```

2. **Browser Console Error** (F12 Console tab):
   ```
   [error message with line numbers]
   ```

3. **What You're Trying to Do**:
   ```
   1. Navigate to...
   2. Fill form with...
   3. Click...
   4. Error appears: ...
   ```

4. **Test Script Output**:
   ```
   python test_sms_complete.py
   [paste output]
   ```

---

## ✅ Verification Tests

After applying fixes, run these to verify:

### Test 1: Admin User
```bash
python manage.py shell
from accounts.models import User
u = User.objects.get(email='mrm53451@gmail.com')
print(f"Email: {u.email}")
print(f"Is Staff: {u.is_staff}")
print(f"Is Superuser: {u.is_superuser}")
```
**Expected:** All True

### Test 2: API Endpoint
```bash
python manage.py runserver  # In one terminal
# In another:
python test_sms_complete.py
```
**Expected:** No 500 errors, clear test output

### Test 3: Frontend Form
```
http://localhost:3000/admin/sms/credentials
→ Fill form
→ Click Save
→ See success message
```
**Expected:** Green success message, no error

### Test 4: Database
```bash
python manage.py shell
from accounts.models import SMSCredential
c = SMSCredential.objects.filter(is_active=True).first()
print(c.user)
print(c.sender_ids)
```
**Expected:** Your values are there

---

## 🎯 Next Steps

After confirming credentials save successfully:

1. ✅ Go to `/sms/send`
2. ✅ Sender IDs should appear in dropdown
3. ✅ Compose test message
4. ✅ Send to test number
5. ✅ Check `/sms/history` for delivery status

---

**Last Updated:** February 24, 2026  
**Fixes Applied:** Credentials view rewrite, import fixes, error handling enhancement
