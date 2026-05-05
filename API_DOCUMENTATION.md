# Messaging Platform API Documentation

## 1. Introduction

This documentation describes the API used by this application backend.

- Base URL: `http://<your-domain-or-ip>`
- API prefix: `/api/auth/`
- Format: JSON request and JSON response
- Auth: JWT Bearer token for protected endpoints

Public health endpoint:

- `GET /healthz/`

---

## 2. Authentication

### 2.1 Sign Up

- Endpoint: `POST /api/auth/signup/`
- Auth: Public

Request:

```json
{
  "first_name": "Alex",
  "email": "alex@example.com",
  "phone_number": "9876543210",
  "password": "StrongPassword@123"
}
```

### 2.2 Verify OTP

- Endpoint: `POST /api/auth/verify-otp/`
- Auth: Public

### 2.3 Resend OTP

- Endpoint: `POST /api/auth/resend-otp/`
- Auth: Public

### 2.4 Login

- Endpoint: `POST /api/auth/login/`
- Auth: Public

Response returns JWT tokens.

### 2.5 Refresh Token

- Endpoint: `POST /api/auth/token/refresh/`
- Auth: Public

### 2.6 Forgot Password

- Endpoint: `POST /api/auth/forgot-password/`
- Auth: Public

### 2.7 Reset Password

- Endpoint: `POST /api/auth/reset-password/`
- Auth: Public

---

## 3. Profile and Usage

### 3.1 Get Profile

- Endpoint: `GET /api/auth/profile/`
- Auth: JWT

Response includes:

- identity fields (`id`, `first_name`, `email`, `phone_number`)
- access flags (`is_staff`, `is_superuser`, `is_primary_admin`, `is_sms_enabled`)
- usage fields (`sms_total_limit`, `sms_used_messages`, `sms_available_messages`)
- wallet field (`wallet_balance`)

Notes:

- For primary admin users, `wallet_balance` uses real provider balance when balance endpoint is configured.
- If provider balance is unavailable, backend falls back to computed local balance.

### 3.2 Update Profile

- Endpoint: `PATCH /api/auth/profile/`
- Auth: JWT

Supports profile updates and sender identity settings.

### 3.3 Usage Summary

- Endpoint: `GET /api/auth/sms/usage-summary/`
- Auth: JWT

---

## 4. SMS Sending and Tracking

### 4.1 Send SMS

- Endpoint: `POST /api/auth/sms/send/`
- Auth: JWT + Admin

Example:

```json
{
  "display_sender_id": "ABC",
  "message_content": "Hello from your app",
  "recipient_number": "919876543210",
  "send_mode": "single",
  "transport": "api"
}
```

### 4.2 List Messages

- Endpoint: `GET /api/auth/sms/messages/`
- Auth: JWT

### 4.3 Message Status

- Endpoint: `GET /api/auth/sms/messages/{id}/`
- Auth: JWT

### 4.4 SMS Credentials

- Endpoint: `GET/PATCH /api/auth/sms/credentials/`
- Auth: JWT + Admin

### 4.5 Contact Groups

- Endpoint: `GET/POST /api/auth/sms/groups/`
- Auth: JWT + Admin

### 4.6 Short URLs

- Endpoint: `GET/POST /api/auth/sms/short-urls/`
- Auth: JWT + Admin

- Endpoint: `PATCH/DELETE /api/auth/sms/short-urls/{url_id}/`
- Auth: JWT + Admin

### 4.7 Timezones

- Endpoint: `GET /api/auth/sms/timezones/`
- Auth: JWT

---

## 5. Free Trial SMS

### 5.1 Send OTP (trial flow)

- Endpoint: `POST /api/auth/sms/free-trial/send-otp/`
- Auth: JWT

### 5.2 Verify OTP (trial flow)

- Endpoint: `POST /api/auth/sms/free-trial/verify-otp/`
- Auth: JWT/Public depending session

### 5.3 Verified Numbers

- Endpoint: `GET /api/auth/sms/free-trial/verified-numbers/`
- Auth: JWT

### 5.4 Send Free Trial SMS

- Endpoint: `POST /api/auth/sms/free-trial/send/`
- Auth: JWT

---

## 6. Admin and User Management

### 6.1 List Users

- Endpoint: `GET /api/auth/admin/users/`
- Auth: JWT + Primary Admin

### 6.2 Update User Permission/Profile Flags

- Endpoint: `PATCH /api/auth/admin/users/{user_id}/permissions/`
- Auth: JWT + Primary Admin

### 6.3 Delete User

- Endpoint: `DELETE /api/auth/admin/users/{user_id}/permissions/`
- Auth: JWT + Primary Admin

### 6.4 Export Users

- Endpoint: `GET /api/auth/admin/users/export/`
- Auth: JWT + Primary Admin

### 6.5 SMS Admin Users View

- Endpoint: `GET /api/auth/sms/admin/users/`
- Auth: JWT + Admin

### 6.6 SMS Eligibility per User

- Endpoint: `PATCH /api/auth/sms/users/{user_id}/eligibility/`
- Auth: JWT + Admin

---

## 7. Internal Notifications

### 7.1 Preview Recipients

- Endpoint: `POST /api/auth/admin/notifications/preview/`
- Auth: JWT + Primary Admin

### 7.2 Send Notification

- Endpoint: `POST /api/auth/admin/notifications/send/`
- Auth: JWT + Primary Admin

### 7.3 Notification History

- Endpoint: `GET /api/auth/admin/notifications/history/`
- Auth: JWT + Primary Admin

### 7.4 My Notifications

- Endpoint: `GET /api/auth/notifications/my/`
- Auth: JWT

### 7.5 Mark Read

- Endpoint: `POST /api/auth/notifications/my/{recipient_id}/read/`
- Auth: JWT

---

## 8. Error Handling

Common response format:

```json
{
  "detail": "Error message"
}
```

Common HTTP statuses:

- `200` success
- `201` created
- `204` no content
- `400` validation error
- `401` unauthenticated
- `403` forbidden
- `404` not found
- `500` internal server error

---

## 9. cURL Quick Reference

### Login

```bash
curl -X POST http://<your-domain-or-ip>/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

### Send SMS

```bash
curl -X POST http://<your-domain-or-ip>/api/auth/sms/send/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "display_sender_id":"ABC",
    "message_content":"Hello",
    "recipient_number":"919876543210"
  }'
```

### Send SMS via SMPP transport

```bash
curl -X POST http://<your-domain-or-ip>/api/auth/sms/send/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transport":"smpp",
    "smpp_profile":"standard",
    "display_sender_id":"MOBISHASTRA",
    "message_content":"SMPP route test",
    "recipient_number":"919876543210",
    "smpp_host":"smpp.your-provider.com",
    "smpp_port":2775,
    "smpp_system_id":"your_system_id",
    "smpp_password":"your_smpp_password"
  }'
```

### Send DLT SMPP message

```bash
curl -X POST http://<your-domain-or-ip>/api/auth/sms/send/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transport":"smpp",
    "smpp_profile":"dlt",
    "display_sender_id":"MOBISHASTRA",
    "message_content":"Your order is dispatched",
    "recipient_number":"919876543210",
    "smpp_host":"smpp.your-provider.com",
    "smpp_port":2775,
    "smpp_system_id":"your_system_id",
    "smpp_password":"your_smpp_password",
    "smpp_template_id":"DLT_TEMPLATE_1001"
  }'
```

### Bulk send (numbers file)

```bash
curl -X POST http://<your-domain-or-ip>/api/auth/sms/send/ \
  -H "Authorization: Bearer <access_token>" \
  -F "transport=api" \
  -F "send_mode=file_numbers" \
  -F "display_sender_id=MOBISHASTRA" \
  -F "message_content=Campaign message" \
  -F "source_file=@contacts.xlsx"
```

### Profile

```bash
curl -X GET http://<your-domain-or-ip>/api/auth/profile/ \
  -H "Authorization: Bearer <access_token>"
```

---

## 10. Notes for Deployment

Optional environment settings for wallet balance sync:

- `SMS_PROVIDER_BALANCE_URL`
- `SMS_PROVIDER_BALANCE_METHOD` (`GET` or `POST`)

Provider balance integration behavior:

- If `SMS_PROVIDER_BALANCE_URL` is configured, admin wallet uses that endpoint directly.
- If not configured and backend has provider-specific defaults, it may auto-try known balance endpoints.
- If all balance calls fail, backend safely falls back to local computed wallet.
