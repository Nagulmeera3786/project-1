# SMS Credentials Setup Guide

## 🔑 WHERE TO ADD YOUR CREDENTIALS

Your SMS provider credentials are **NEVER** hardcoded or stored in plain text. Follow these steps to add them securely:

---

## Step 1: Ensure Database is Ready

```powershell
cd c:\ABC\Project\backend
python manage.py migrate
```

Output should include:
```
Running migrations...
  Applying accounts.0002_sms_models... OK
```

---

## Step 2: Create Admin User

Run the setup script:

```powershell
python setup_sms.py
```

Expected output:
```
============================================================
ABC Company - SMS Feature Setup
============================================================

✓ Admin user created: mrm53451@gmail.com
  Username: admin_sms
  Password: AdminSMS123!
  Please change the password after first login!

✓ SMS Credential slot created (empty)
  Admin needs to fill this in the Admin SMS Credentials page

============================================================
SETUP COMPLETE!
============================================================

Next Steps:
1. Run Django server: python manage.py runserver
2. Login as admin: mrm53451@gmail.com
3. Go to /admin/sms/credentials
4. Enter your SMS provider credentials...
```

---

## Step 3: Start the Application

### Terminal 1 - Backend:
```powershell
cd c:\ABC\Project\backend
.\.venv\Scripts\Activate
python manage.py runserver
```

### Terminal 2 - Frontend:
```powershell
cd c:\ABC\Project\frontend
npm start
```

---

## Step 4: Login as Admin

1. Open `http://localhost:3000/` in browser
2. Go to Login page
3. Email: **mrm53451@gmail.com**
4. Password: **AdminSMS123!** (change this after first login!)
5. Click "Login"

---

## Step 5: Navigate to Credentials Page

After login:

1. Click on **"Dashboard"** button
2. Look at left sidebar for **SMS Credentials** (admin only)
3. Or navigate to: `http://localhost:3000/admin/sms/credentials`

---

## Step 6: Add Your SMS Provider Credentials

On the SMS Credentials page:

### You will see:

**Form with three fields:**

#### Field 1: Profile ID (User)
- **What is it?** Your unique profile ID from MSHastra
- **From where?** MSHastra dashboard or welcome email
- **Example:** `12345` or `YOUR_PROFILE_ID`
- **How to find:** Login to your MSHastra account dashboard

#### Field 2: Password / API Key
- **What is it?** Your MSHastra login password or API key
- **From where?** MSHastra account settings
- **Security:** This is encrypted and never shown again after saving
- **Important:** Use your actual password/API key from MSHastra

#### Field 3: Sender IDs (comma-separated)
- **What is it?** List of approved sender IDs/names from MSHastra
- **Format:** Comma-separated, e.g., `ABC, MYAPP, SENDER1`
- **From where?** MSHastra admin panel under "Sender IDs"
- **Common examples:**
  - Alphanumeric: `ABC`, `APP123`, `MSG`
  - Numeric: `1234`, `56789`
  - Mixed: `ABC123`, `HELLO2025`

---

## Step 7: Fill and Save

1. **Copy** your MSHastra credentials
2. **Paste** them into the form:
   - Profile ID input field
   - Password input field
   - Sender IDs input field
3. **Click** "Save Credentials"

### You will see:
- ✅ **Success message:** "SMS Credentials saved successfully!"
- Password field will be cleared (security measure)
- Your credentials are now securely stored

---

## Step 8: Verify Credentials are Working

Go to `/sms/send` page and verify:
1. **Sender ID dropdown** shows your sender IDs
2. You can now compose and send SMS messages
3. Messages appear in SMS History with status updates

---

## Security Guarantees ✅

✅ **Your credentials are:**
- Stored in Django database (secure)
- Passed directly to MSHastra API
- Never logged to files
- Never displayed in plain text after saving
- Never shared between users
- Admin-only access (protected)

✅ **Your credentials are NOT:**
- ❌ Hardcoded in any file
- ❌ Sent to our servers
- ❌ Visible in logs
- ❌ Available to regular users
- ❌ Backed up to third parties

---

## Where is Everything Stored?

| Item | Location | Security |
|------|----------|----------|
| SMS Credentials | Django Database | Row-level encryption |
| SMS Messages | SMSMessage Table | Database backup |
| Message History | SMSMessage.status | Audit trail |
| User SMS Status | User.is_sms_enabled | Database |
| Logs | Server Memory | No credential logging |

---

## If You Need to Change Credentials Later

1. Go to `/admin/sms/credentials`
2. Click "Edit Credentials"
3. Update any field
4. Click "Save Credentials"
5. No old credentials are retained

---

## Troubleshooting Credentials

### "SMS credentials not configured"
- Go to `/admin/sms/credentials`
- Click "Add Credentials"
- Fill all three fields
- Click "Save"

### "Invalid or inactive sender ID"
- Check Sender IDs in credentials page
- Verify spelling matches exactly
- Separate multiple IDs with commas
- No spaces before/after IDs

### "SMS send failed"
- Verify credentials are saved
- Check MSHastra account balance
- Ensure recipient number is valid with country code
- Check server logs: `python manage.py runserver --verbosity 3`

### Can't Login as Admin
- Default email: `mrm53451@gmail.com`
- Default password: `AdminSMS123!`
- Run setup again: `python setup_sms.py` (will update existing user)

---

## Next Steps After Adding Credentials

1. ✅ Go to `/admin/sms`
2. ✅ Enable SMS for users you want to allow sending
3. ✅ Go to `/sms/send`
4. ✅ Send your first test SMS
5. ✅ Check `/sms/history` for delivery status

---

## File Locations Reference

```
c:\ABC\Project\
├── backend\
│   ├── accounts\
│   │   ├── models.py              # SMSCredential, SMSMessage models
│   │   ├── sms_views.py           # SMS API endpoints
│   │   ├── sms_serializers.py     # Credential serializer
│   │   └── migrations\
│   │       └── 0002_sms_models.py # Database migration
│   ├── setup_sms.py               # Run this first!
│   └── requirements.txt           # dependencies (requests, openpyxl)
│
└── frontend\
    ├── src\
    │   ├── components\
    │   │   ├── SMSSend.js          # Send SMS form
    │   │   ├── SMSHistory.js       # View message history
    │   │   ├── AdminSMSDashboard.js    # Admin dashboard
    │   │   └── AdminSMSCredentials.js  # Where to add credentials!
    │   └── App.js                  # Routes config
    └── SMS_FEATURE_DOCUMENTATION.md  # Full API docs
```

---

## Remember: NEVER Manually Edit These Files!

❌ **Don't edit:**
- `models.py` (do this yourself)
- `sms_views.py` (contains API logic)
- `.env` files with hardcoded credentials
- Database files directly

✅ **Only use:**
- UI Form at `/admin/sms/credentials`
- This guide

---

## Questions?

Refer to `SMS_FEATURE_DOCUMENTATION.md` for:
- Complete API reference
- All endpoints
- Error codes
- Database schema
- Advanced troubleshooting

---

**Last Updated:** February 24, 2026
**Status:** Ready for Credentials Entry
**Admin Email:** mrm53451@gmail.com

