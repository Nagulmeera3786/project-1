# SMS Feature - Quick Start Checklist

## 🎯 5-Minute Setup

Copy and paste these commands in order:

### Terminal 1: Database & Server
```powershell
cd c:\ABC\Project\backend
python manage.py migrate
python setup_sms.py
python manage.py runserver
```

### Terminal 2: Frontend
```powershell
cd c:\ABC\Project\frontend
npm start
```

### Terminal 3: Test Verification
```powershell
cd c:\ABC\Project\backend
python test_sms_complete.py
```

**Expected:** Test script shows all tests passing ✅

---

## 🔑 Login Credentials

```
Email: mrm53451@gmail.com
Password: AdminSMS123!
⚠️ Change password on first login
```

---

## 🗺️ Navigation Map

After login to http://localhost:3000:

| Page | URL | What to Do |
|------|-----|-----------|
| Save Credentials | `/admin/sms/credentials` | Add your MSHastra Profile ID, Password, Sender IDs |
| Send SMS | `/sms/send` | Choose sender ID (dropdown auto-populated), compose message, send |
| View History | `/sms/history` | See all messages with delivery status |
| Admin Dashboard | `/admin/sms` | Users tab: toggle SMS eligibility, download Excel |
| | | Messages tab: view all SMS messages |

---

## ✅ Verification Steps

After setup, verify each step:

### ✓ Step 1: Database
```bash
# Terminal 3 (backend folder):
python manage.py showmigrations accounts
```
Look for: `[X] 0002_sms_models`

### ✓ Step 2: Admin User
```bash
# Terminal 3:
python manage.py shell
from accounts.models import User
u = User.objects.get(email='mrm53451@gmail.com')
print(f"Created: {u.created_at}, is_staff: {u.is_staff}")
exit()
```

### ✓ Step 3: Backend Running
Check Terminal 1 output:
```
Starting development server at http://127.0.0.1:8000/
```

### ✓ Step 4: Frontend Running
Check Terminal 2 output:
```
webpack compiled successfully
```

### ✓ Step 5: Test Script
Check Terminal 3 output:
```
✅ All tests passed!
```

### ✓ Step 6: Login Works
1. Go to http://localhost:3000
2. Login with mrm53451@gmail.com / AdminSMS123!
3. Should see dashboard

### ✓ Step 7: Credentials Save Works (THE FIX)
1. Click menu → SMS Credentials
2. Fill form:
   - Profile ID: `test_profile`
   - Password: `test_password`
   - Sender IDs: `ABC, TEST`
3. Click "Save Credentials"
4. Should see: ✅ Green success message
5. Values should appear on page
6. Verify in database:
   ```bash
   # Terminal 3:
   python manage.py shell
   from accounts.models import SMSCredential
   c = SMSCredential.objects.filter(is_active=True).first()
   print(f"User: {c.user}, Sender IDs: {c.sender_ids}")
   exit()
   ```

---

## 🐛 Quick Troubleshooting

### Issue: "Failed to save credentials"
**Solution:**
1. Hard refresh: Ctrl+Shift+R
2. Restart backend (Terminal 1, press Ctrl+C, run command again)
3. Try again

### Issue: "Profile ID and Password required" error
**Solution:** 
1. Make sure both fields have text
2. Check you're logged in as admin user

### Issue: Sender ID dropdown empty
**Solution:**
1. Verify credentials saved (backend check above)
2. Reload page
3. Stop and restart frontend (Terminal 2, Ctrl+C, npm start)

### Issue: Server shows error 500
**Solution:**
1. Look at Terminal 1 (backend) for error message
2. Check error matches one in SMS_DEBUGGING_GUIDE.md
3. Common fix: Restart backend

### Issue: Can't login
**Solution:**
1. Verify admin user created: `python manage.py shell` → `User.objects.all()` → check for mrm53451@gmail.com
2. If not there, run: `python setup_sms.py` again
3. Restart backend

---

## 📦 What Gets Created

Running through the setup creates:

**In Database:**
- [ ] SMSMessage table (tracks SMS)
- [ ] SMSCredential table (stores API credentials)
- [ ] User.is_sms_enabled field (SMS eligibility per user)
- [ ] Admin user: mrm53451@gmail.com

**In Backend Files:**
- [ ] sms_views.py (6 API endpoints)
- [ ] sms_serializers.py (validation)
- [ ] migration 0002_sms_models.py (database schema)

**In Frontend:**
- [ ] SMSSend component
- [ ] SMSHistory component
- [ ] AdminSMSDashboard component
- [ ] AdminSMSCredentials component
- [ ] Associated routes and navigation

---

## 🎯 Next: Add Real Credentials

Once verified working with test data:

1. Get MSHastra account
2. Get your:
   - Profile ID (username)
   - Password (API key)
   - Sender IDs (e.g., "MYCOMPANY")
3. Go to `/admin/sms/credentials`
4. Update form with real values
5. Save
6. Test SMS send with real number

---

## 📞 Emergency Reset

If everything breaks:

```bash
# 1. Delete database
cd c:\ABC\Project\backend
del db.sqlite3

# 2. Migrate fresh
python manage.py migrate

# 3. Setup admin again
python setup_sms.py

# 4. Restart backend
python manage.py runserver
```

---

## ✨ You're All Set!

Follow the commands at top of this doc and verify each step.  
If all checks pass ✅, SMS feature is working perfectly.

**Time estimate:** 5-10 minutes

