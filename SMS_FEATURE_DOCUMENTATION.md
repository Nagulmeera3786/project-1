# SMS Messaging Feature Documentation

## Overview

This application now includes **real-time SMS messaging** functionality. Only **admin users** (staff members) can send SMS messages. Regular users can receive SMS and view their message history.

---

## 🔐 Security & Credentials

### Important Security Notes

✅ **Your credentials are NEVER:**
- Hardcoded in the application
- Logged to files or console
- Displayed in plain text after saving
- Shared between users

✅ **Your credentials ARE:**
- Stored securely in the database
- Passed directly to the SMS provider API
- Accessible only by admin users
- Protected with Django's database encryption

### Where to Add Credentials

1. Start the backend server:
   ```powershell
   cd backend
   python manage.py runserver
   ```

2. Run migrations (if not already done):
   ```powershell
   python manage.py migrate
   ```

3. Run the setup script to create admin user:
   ```powershell
   python setup_sms.py
   ```

4. Login as admin: **mrm53451@gmail.com**

5. Navigate to: **Admin Dashboard → SMS Management → SMS Credentials**

6. Click "Add Credentials" and enter:
   - **Profile ID (User)**: Your MSHastra profile ID
   - **Password/API Key**: Your MSHastra password
   - **Sender IDs**: Your approved sender IDs (comma-separated)
     - Example: `ABC, MYAPP, SENDER1`

---

## 📱 API Endpoints

All SMS endpoints require authentication (JWT token).

### 1. Send SMS (Admin Only)

**Endpoint:** `POST /api/auth/sms/send/`

**Request Body:**
```json
{
  "sender_id": "ABC",
  "message_content": "Hello from admin",
  "recipient_number": "+919876543210",
  "recipient_user_id": 5  // optional
}
```

**Response (Success):**
```json
{
  "id": 1,
  "sender": 1,
  "sender_username": "admin_sms",
  "recipient_number": "+919876543210",
  "recipient_user": 5,
  "recipient_username": "john_doe",
  "sender_id": "ABC",
  "message_content": "Hello from admin",
  "status": "sent",
  "message_id": "MSG-12345",
  "delivery_time": "2026-02-24T10:30:45.123Z",
  "created_at": "2026-02-24T10:30:45.123Z",
  "updated_at": "2026-02-24T10:30:45.123Z"
}
```

**Error Response:**
```json
{
  "detail": "Only admins can send SMS"
}
```

---

### 2. Get SMS Messages History

**Endpoint:** `GET /api/auth/sms/messages/`

**Response:**
```json
[
  {
    "id": 1,
    "sender_username": "admin_sms",
    "recipient_number": "+919876543210",
    "recipient_username": "john_doe",
    "sender_id": "ABC",
    "message_content": "Your verification code is 123456",
    "status": "delivered",
    "message_id": "MSG-12345",
    "created_at": "2026-02-24T10:30:45.123Z"
  }
]
```

**Behavior:**
- **Admin users**: See all messages sent by anyone
- **Regular users**: See only their sent messages + received messages

---

### 3. Get Message Status

**Endpoint:** `GET /api/auth/sms/messages/<message_id>/`

**Response:**
```json
{
  "id": 1,
  "status": "delivered",
  "message_id": "MSG-12345",
  "delivery_time": "2026-02-24T10:30:46.000Z",
  "created_at": "2026-02-24T10:30:45.123Z"
}
```

**Status Options:**
- `pending` - SMS queued for sending
- `sent` - SMS sent to provider
- `delivered` - SMS delivered to recipient
- `failed` - SMS failed to send

---

### 4. Manage SMS Credentials (Admin Only)

**Endpoint:** `GET /api/auth/sms/credentials/`

**Response:**
```json
{
  "user": "profile_id",
  "sender_ids": ["ABC", "MYAPP"],
  "is_active": true,
  "created_at": "2026-02-24T10:00:00.000Z",
  "updated_at": "2026-02-24T10:00:00.000Z"
}
```

**Note:** Password is never returned for security.

**Update Credentials:**

**Endpoint:** `PATCH /api/auth/sms/credentials/`

```json
{
  "user": "new_profile_id",
  "password": "new_password",
  "sender_ids": ["ABC", "NEWID"],
  "is_active": true
}
```

---

### 5. Toggle User SMS Eligibility (Admin Only)

**Endpoint:** `PATCH /api/auth/sms/users/<user_id>/eligibility/`

**Request Body:**
```json
{
  "is_sms_enabled": true
}
```

**Response:**
```json
{
  "id": 5,
  "username": "john_doe",
  "email": "john@example.com",
  "is_sms_enabled": true
}
```

---

### 6. Get All Users (Admin Only)

**Endpoint:** `GET /api/auth/sms/admin/users/`

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin_sms",
    "email": "mrm53451@gmail.com",
    "is_sms_enabled": false
  },
  {
    "id": 5,
    "username": "john_doe",
    "email": "john@example.com",
    "is_sms_enabled": true
  }
]
```

---

## 🎨 Frontend Components

### 1. Send SMS Page

**Route:** `/sms/send`

- **Access:** Admins only
- **Features:**
  - Select sender ID from configured list
  - Enter message content (max 500 chars)
  - Enter recipient phone number
  - Optional: Select recipient from registered users
  - Real-time character count
  - Success/error notifications

### 2. SMS History Page

**Route:** `/sms/history`

- **Access:** All authenticated users
- **Features:**
  - View all sent/received messages
  - Filter by status (pending, sent, delivered, failed)
  - Auto-refresh every 10 seconds
  - Display message ID, content, sender, recipient
  - Color-coded status indicators
  - Delivery timestamp

### 3. Admin SMS Dashboard

**Route:** `/admin/sms`

- **Access:** Admins only
- **Features:**
  - **Users Tab:**
    - View all registered users
    - Toggle SMS eligibility per user
    - Download all users data as Excel
    - Visual indicators for SMS status
  - **Messages Tab:**
    - View all messages sent by all admins
    - Status overview
    - Message delivery tracking
    - Shows last 20 messages

### 4. SMS Credentials Management

**Route:** `/admin/sms/credentials`

- **Access:** Admins only
- **Features:**
  - View current credentials (masked password)
  - Edit credentials securely
  - Update sender IDs
  - Security warnings about credential protection
  - Password is always write-only

---

## 🔧 Backend Architecture

### Models

#### SMSMessage
```python
- sender (FK to User)           # Admin who sent message
- recipient_number (CharField)  # Phone number
- recipient_user (FK to User)   # Nullable, link to registered user
- sender_id (CharField)         # Display name (e.g., "ABC")
- message_content (TextField)   # SMS body
- status (CharField)            # pending|sent|delivered|failed
- message_id (CharField)        # Provider's message ID
- delivery_time (DateTimeField) # When message was delivered
- created_at (DateTimeField)    # When created
- updated_at (DateTimeField)    # Last update
```

#### SMSCredential
```python
- user (CharField)          # Profile ID from provider
- password (CharField)      # Encrypted password
- sender_ids (JSONField)    # List of approved sender IDs
- is_active (BooleanField)  # Enable/disable credentials
- created_at (DateTimeField)
- updated_at (DateTimeField)
```

#### User Model
```python
# Added field:
- is_sms_enabled (BooleanField)  # Can user receive SMS?
```

### Views

- `SMSSendView` - POST to send SMS (admin only)
- `SMSMessageListView` - GET messages (filtered by user role)
- `SMSMessageStatusView` - GET single message status
- `SMSCredentialView` - GET/PATCH credentials (admin only)
- `UserSMSEligibilityView` - PATCH user SMS eligibility
- `AdminUsersSMSListView` - GET all users (admin only)

---

## 🚀 Setup Instructions

### 1. Initial Setup

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
python backend/manage.py migrate

# Create admin user & initialize SMS
python backend/setup_sms.py

# Start backend
python backend/manage.py runserver
```

### 2. Add SMS Provider Credentials

1. Login as **mrm53451@gmail.com**
2. Navigate to `/admin/sms/credentials`
3. Click "Add Credentials"
4. Enter your MSHastra details:
   - Profile ID
   - Password
   - Sender IDs
5. Click "Save Credentials"

Your credentials are now secure and never exposed.

### 3. Enable SMS for Users

1. Go to `/admin/sms`
2. In "Users & SMS Eligibility" tab
3. Toggle SMS on/off for each user
4. Click "Download Users Data" to export

### 4. Send Your First SMS

1. Go to `/sms/send`
2. Fill the form:
   - Sender ID: Select from list
   - Message: Compose message
   - Recipient Number: Enter phone with country code
   - (Optional) Select user from list
3. Click "Send SMS"
4. Check `/sms/history` to track delivery

---

## 📊 Testing

### Test Script

```bash
# Run included SMS test (backend must be running)
python backend/test_admin_export.py

# Or write your own:
curl -X POST http://localhost:8000/api/auth/sms/send/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sender_id": "ABC",
    "message_content": "Test message",
    "recipient_number": "+919876543210"
  }'
```

---

## 🔒 Security Best Practices

1. **Never share your credentials** with anyone except trusted team members
2. **Change your SMS provider password** regularly
3. **Monitor credentials page** for unauthorized access attempts
4. **Keep admin account secure** with a strong password
5. **Check message history** regularly for suspicious messages
6. **Disable SMS for users** who don't need it

---

## ⚠️ Important Notes

1. **Credentials are required** before sending any SMS
2. **Phone numbers** must include country code (e.g., +91)
3. **Message content** is limited to 500 characters
4. **Sender ID** must match one of your approved IDs in the credentials
5. **SMS delivery status** is updated via vendor API (may have delays)
6. **Database backups** should exclude credentials for security

---

## Troubleshooting

### SMS Not Sending

**Problem:** Status remains "pending"

**Solutions:**
1. Check if credentials are saved in `/admin/sms/credentials`
2. Verify sender ID matches one in credentials
3. Ensure recipient phone number is valid with country code
4. Check SMS provider account balance/credits

### Credentials Not Saving

**Problem:** Error message when saving credentials

**Solutions:**
1. Ensure all fields are filled
2. Verify Sender IDs are comma-separated
3. Check database connection
4. Review server logs for detailed error

### Users Can't Receive SMS

**Problem:** SMS sent but user eligibility is disabled

**Solutions:**
1. Go to `/admin/sms`
2. Enable SMS for the user in "Users & SMS Eligibility"
3. Try sending again

---

## API Error Codes

| Status | Meaning | Solution |
|--------|---------|----------|
| 201 | SMS Sent | Check history for progress |
| 400 | Bad Request | Check field validation errors |
| 403 | Forbidden | User doesn't have SMS permission |
| 404 | Not Found | Invalid credent IDs or users |
| 500 | Server Error | Check server logs, verify SMS provider |

---

## Questions or Issues?

Refer to the main project documentation or check the server logs:

```bash
# View Django logs
python backend/manage.py runserver --verbosity 3
```

---

**Last Updated:** February 24, 2026  
**Feature Status:** ✅ Production Ready  
**Admin User:** mrm53451@gmail.com

