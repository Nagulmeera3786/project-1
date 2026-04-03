# ⚡ SMS FEATURE - QUICK REFERENCE

## 🎯 One-Minute Checklist

```
✅ python manage.py migrate
✅ python setup_sms.py
✅ python manage.py runserver (Terminal 1)
✅ npm start (Terminal 2)
✅ Login: mrm53451@gmail.com / AdminSMS123!
✅ Go to: /admin/sms/credentials
✅ Add your MSHastra credentials
✅ Done! Start sending SMS
```

---

## 🔑 Credentials Form (What to Fill)

```
Profile ID (User):     YOUR_MSHASTRA_PROFILE_ID
Password/API Key:      YOUR_MSHASTRA_PASSWORD
Sender IDs:            ABC, MYAPP (comma-separated)
```

**Never share these with anyone except trusted admins!**

---

## 📱 Send SMS (3 Steps)

1. Go to `/sms/send`
2. Fill: Sender ID → Message → Phone Number
3. Click "Send SMS"

**Phone format:** `+919876543210` (with country code)

---

## 👁️ View History

Go to `/sms/history` to see:
- All messages
- Delivery status
- Message IDs
- Sent time

Auto-refreshes every 10 seconds!

---

## 🛑 Admin Controls

**URL:** `/admin/sms`

**Tab 1: Users & SMS Eligibility**
- Toggle SMS on/off per user
- Download users as Excel

**Tab 2: Message History**
- View all sent SMS
- Check delivery status

---

## 🔒 Credentials Storage

✅ **Location:** Database (encrypted)  
✅ **Access:** Admin only  
✅ **Visibility:** Password hidden after save  
✅ **Security:** Never logged or exposed  
✅ **Update:** Go to `/admin/sms/credentials`

---

## 📍 All Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/sms/send` | Send SMS | Admin |
| `/sms/history` | View messages | All users |
| `/admin/sms` | Admin dashboard | Admin |
| `/admin/sms/credentials` | Add credentials | Admin |

---

## 🧪 Test SMS

**CLI:**
```bash
curl -X POST http://localhost:8000/api/auth/sms/send/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sender_id":"ABC","message_content":"Test","recipient_number":"+919876543210"}'
```

**Response:** `{"id":1,"status":"sent","message_id":"MSG-12345"}`

---

## 📋 API Endpoints

```
POST   /api/auth/sms/send/
GET    /api/auth/sms/messages/
GET    /api/auth/sms/messages/<id>/
GET    /api/auth/sms/credentials/
PATCH  /api/auth/sms/credentials/
PATCH  /api/auth/sms/users/<id>/eligibility/
GET    /api/auth/sms/admin/users/
```

---

## ⚙️ Admin Account

```
Email:    mrm53451@gmail.com
Password: AdminSMS123!
```

**Change password after first login!**

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| "Credentials not found" | Add them at `/admin/sms/credentials` |
| "Invalid sender ID" | Check sender ID list in credentials |
| "SMS not sending" | Verify MSHastra account has balance |
| "Can't login" | Use mrm53451@gmail.com / AdminSMS123! |

---

## 📚 Full Docs

- `CREDENTIALS_SETUP.md` - Where to add credentials ⭐
- `SMS_FEATURE_DOCUMENTATION.md` - Complete API reference
- `SMS_FEATURE_READY.md` - Full implementation details

---

## 🚀 Go Live

1. ✅ Migrate database
2. ✅ Create admin user
3. ✅ Start servers
4. ✅ Add credentials
5. ✅ Enable users
6. ✅ Send SMS!

---

**Status:** Ready to Use! 🎉  
**Admin:** mrm53451@gmail.com  
**Credentials Page:** `/admin/sms/credentials`
