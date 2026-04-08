#!/usr/bin/env python
import os
import sys
import django
import requests
import json
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
BASE_URL = 'http://localhost:8000/api/auth'

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def run_flow_test():
    log("\n========== FRONTEND FLOW TEST ==========\n")

    email = "frontendtest@example.com"
    password = "FrontendPass123"

    # Clean up
    User.objects.filter(email=email).delete()

    # 1. SIGNUP - what frontend sends
    log("1. Frontend SIGNUP request...")
    signup_payload = {
        'username': email,
        'email': email,
        'phone_number': '9876543210',
        'password': password,
    }

    try:
        resp = requests.post(f'{BASE_URL}/signup/', json=signup_payload)
        log(f"   Status: {resp.status_code}")
        if resp.status_code == 201:
            log("   [OK] Signup successful")
            user = User.objects.get(email=email)
            otp = user.otp_code
            log(f"   OTP generated: {otp}")
        else:
            log(f"   [FAIL] Response: {resp.text}")
            sys.exit(1)
    except Exception as e:
        log(f"   [ERROR] {e}")
        sys.exit(1)

    # 2. VERIFY OTP
    log("\n2. Frontend VERIFY OTP request...")
    verify_payload = {
        'email': email,
        'otp': otp,
    }

    try:
        resp = requests.post(f'{BASE_URL}/verify-otp/', json=verify_payload)
        log(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            log("   [OK] OTP verified, got tokens")
            tokens = resp.json()
            access_token = tokens.get('access')
            log(f"   Access token received: {access_token[:20]}...")
        else:
            log(f"   [FAIL] Response: {resp.text}")
            sys.exit(1)
    except Exception as e:
        log(f"   [ERROR] {e}")
        sys.exit(1)

    # 3. LOGIN with credentials
    log("\n3. Frontend LOGIN request...")
    login_payload = {
        'email': email,
        'password': password,
    }

    try:
        resp = requests.post(f'{BASE_URL}/login/', json=login_payload)
        log(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            log("   [OK] Login successful, tokens returned")
            tokens = resp.json()
            log("   Would redirect to /dashboard with token stored in localStorage")
        else:
            log(f"   [FAIL] Response: {resp.text}")
            sys.exit(1)
    except Exception as e:
        log(f"   [ERROR] {e}")
        sys.exit(1)

    log("\n========== ALL FRONTEND FLOWS WORKING! ==========\n")


if __name__ == '__main__':
    run_flow_test()

