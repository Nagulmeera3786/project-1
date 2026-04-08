# Forgot Password API Documentation

## Base URL
```
http://localhost:8000/api/auth/
```

## Endpoints

### 1. Request OTP for Password Reset
**Endpoint:** `POST /api/auth/forgot-password/`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** 
- Status: `204 No Content` (on success)
- No response body

**Email Sent:**
```
Subject: Your verification code
From: no-reply@example.com
To: user@example.com

Your OTP is 123456
```

**Error Responses:**
- Status: `400 Bad Request`
- Body: `{"email": ["This field may not be blank."]}`

---

### 2. Reset Password with OTP
**Endpoint:** `POST /api/auth/reset-password/`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "NewSecurePassword123"
}
```

**Response (Success):**
- Status: `200 OK`
- Body: Empty or `{}`

**Response (Invalid OTP):**
- Status: `400 Bad Request`
- Body: `{"detail": "Invalid or expired OTP"}`

**Response (Invalid Email):**
- Status: `400 Bad Request`
- Body: `{"detail": "Invalid email"}`

**Response (Weak Password):**
- Status: `400 Bad Request`
- Body: 
```json
{
  "new_password": [
    "This password is too common.",
    "Your password must contain at least 8 characters."
  ]
}
```

---

## Complete User Flow

### Step 1: User Requests Password Reset
```javascript
const response = await fetch('http://localhost:8000/api/auth/forgot-password/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});
// Response: 204 No Content
// User receives email with OTP
```

### Step 2: User Enters OTP and New Password
```javascript
const response = await fetch('http://localhost:8000/api/auth/reset-password/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    otp: '123456',
    new_password: 'NewPassword123'
  })
});
// Response: 200 OK
// Password updated successfully
```

### Step 3: User Logs In with New Password
```javascript
const response = await fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'NewPassword123'
  })
});
// Response: 200 OK
// Body: { "access": "jwt_token", "refresh": "jwt_token" }
```

---

## OTP Details

- **Length:** 6 digits
- **Format:** Numbers only (0-9)
- **Expiry:** 10 minutes
- **Resend:** Make another request to forgot-password/ endpoint

## Password Requirements

- **Minimum Length:** 8 characters
- **No Common Passwords:** Django's built-in validation
- **Not Entirely Numeric:** Django's built-in validation
- **Not Too Similar to Email:** Django's built-in validation

## Standard HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 204 | Success (No Content) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 415 | Unsupported Media Type |

---

## curl Examples

### Request OTP
```bash
curl -X POST http://localhost:8000/api/auth/forgot-password/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:8000/api/auth/reset-password/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "new_password": "NewPassword123"
  }'
```

---

## Related Endpoints

### Signup with Email Verification
  - **Endpoint:** `POST /api/auth/signup/`
  - See Signup.js component for full flow

### Verify OTP (Signup)
- **Endpoint:** `POST /api/auth/verify-otp/`
- Used after signup, before first login

### Login
- **Endpoint:** `POST /api/auth/login/`
- After password reset or account verification

### Admin User Management (requires staff credentials)

#### List Users
- **Endpoint:** `GET /api/auth/admin/users/`
- Returns an array of user objects with fields:
  `id`, `username`, `email`, `phone_number`, `is_active`, `is_staff`, `date_joined`.

#### Export Users to Excel
- **Endpoint:** `GET /api/auth/admin/users/export/`
- Returns a downloadable `.xlsx` file containing all users.
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Only accessible by users with `is_staff = true`.


---

## Error Handling Best Practices

```javascript
try {
  const res = await API.post('reset-password/', {
    email, otp, new_password
  });
  // Success - navigate to login
  console.log('Password reset successful');
} catch (err) {
  if (err.response?.status === 400) {
    // Validation error
    const errors = err.response.data;
    console.error('Validation error:', errors);
  } else if (err.response?.status === 401) {
    // Unauthorized
    console.error('Invalid credentials');
  } else {
    // Network or other error
    console.error('Error:', err.message);
  }
}
```

