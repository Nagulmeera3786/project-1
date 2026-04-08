# Forgot Password & OTP Setup Guide

## Real Email Sending Configuration

### Step 1: Set up Gmail App Password

1. **Enable 2-Factor Authentication on your Google Account:**
   - Go to https://myaccount.google.com/security
   - Find "2-Step Verification"
   - Follow the setup process

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character app password
   - Copy this password

### Step 2: Configure Backend

1. **Install required package:**
   ```bash
   cd backend
   pip install python-dotenv
   ```

2. **Create `.env` file in backend folder:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `backend/.env` with your Gmail credentials:**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

### Step 3: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
```

## Features Implemented

### Forgot Password Flow:
1. User clicks "Forgot Password" on login page
2. Enters email address
3. Backend generates 6-digit OTP and sends via Gmail SMTP
4. User receives OTP in inbox within seconds
5. User enters OTP to verify email
6. User sets new password (with confirmation)
7. Password is updated successfully

### Security Features:
- OTP expires after 10 minutes
- Password must be at least 8 characters
- Password confirmation to prevent typos
- Input validation on all fields
- Error handling with user-friendly messages
- OTP is only 6 digits (standard length)

## Testing Email Sending

### If Using Console Email Backend (Default):
The OTP will appear in the terminal running the backend:
```
Subject: Your verification code
From: no-reply@example.com
To: user@example.com

Your OTP is 123456
```

### If Using Gmail SMTP:
- OTP will be sent to user's inbox
- Check spam/promotions folder if not in inbox
- Verify Gmail app password is correct

## Troubleshooting

### Gmail SMTP Connection Issues:
- Verify 2-Factor Authentication is enabled
- Ensure you're using an App Password (not Gmail password)
- Check that EMAIL_USE_TLS=True in .env
- Ensure EMAIL_PORT=587

### OTP Not Arriving:
- Check spam/promotions folder
- Verify EMAIL_USER is correct in .env
- Check Django server logs for errors
- Ensure python-dotenv is installed

### Application Routes:
- `/` - Home/Main Page
- `/signup` - Sign up with email verification
- `/login` - Login after verification
- `/forgot-password` - Request password reset
- `/reset-password` - Verify OTP and set new password
- `/verify-otp` - Verify signup OTP
- `/dashboard` - Protected dashboard (after login)

## Components Updated:

### Backend:
- `accounts/views.py` - ForgotPasswordView, ResetPasswordView (already present)
- `accounts/utils.py` - Email sending logic
- `project/settings.py` - Email configuration with environment variables
- `requirements.txt` - Added python-dotenv

### Frontend:
- `ForgotPassword.js` - Request OTP form with error handling
- `ResetPassword.js` - Verify OTP and set password with validation
- `Login.js` - Enhanced with error handling and forgot password link
- `Signup.js` - Enhanced with password confirmation
- `VerifyOtp.js` - Enhanced OTP verification

## Password Requirements:
- Minimum 8 characters
- Common passwords not allowed
- Cannot be entirely numeric
- Enhanced validation for security

