#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import django
import requests
import json
import time
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import User as CustomUser

User = get_user_model()
BASE_URL = 'http://localhost:8000/api/auth'

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def test_full_flow():
    email = "flowtest@example.com"
    password = "InitialPass123"
    new_password = "NewPass456"
    
    log("\n========== FULL AUTHENTICATION FLOW TEST ==========")
    
    # Clean up any existing user
    User.objects.filter(email=email).delete()
    time.sleep(0.5)
    
    # 1. SIGNUP TEST
    log("1. Testing SIGNUP...")
    signup_data = {
        'email': email,
        'username': email,
        'phone_number': '1234567890',
        'password': password
    }
    try:
        signup_resp = requests.post(f'{BASE_URL}/signup/', json=signup_data)
        log(f"   Status: {signup_resp.status_code}")
        if signup_resp.status_code == 201:
            log("   [OK] Signup successful")
            user_data = signup_resp.json()
            log(f"   User created: {user_data.get('email')}")
        else:
            log(f"   [FAIL] Signup failed: {signup_resp.text}")
            return
    except Exception as e:
        log(f"   [ERROR] Error: {e}")
        return
    
    # Check if user was created and OTP was set
    time.sleep(1)
    try:
        user = User.objects.get(email=email)
        log(f"   OTP Code saved in DB: {user.otp_code}")
        otp = user.otp_code
        log(f"   User is_active: {user.is_active}")
        log(f"   Using OTP: {otp}")
    except User.DoesNotExist:
        log(f"   [ERROR] User not found in database!")
        return
    
    # 2. OTP VERIFY TEST
    log("\n2. Testing OTP VERIFY...")
    otp_verify_data = {
        'email': email,
        'otp': otp
    }
    try:
        otp_resp = requests.post(f'{BASE_URL}/verify-otp/', json=otp_verify_data)
        log(f"   Status: {otp_resp.status_code}")
        if otp_resp.status_code == 200:
            log("   [OK] OTP verification successful")
            user.refresh_from_db()
            log(f"   User is_active after OTP: {user.is_active}")
        else:
            log(f"   [FAIL] OTP verification failed: {otp_resp.text}")
            return
    except Exception as e:
        log(f"   [ERROR] Error: {e}")
        return
    
    # 3. LOGIN TEST (with initial password)
    log("\n3. Testing LOGIN with initial password...")
    login_data = {
        'email': email,
        'password': password
    }
    try:
        login_resp = requests.post(f'{BASE_URL}/login/', json=login_data)
        log(f"   Status: {login_resp.status_code}")
        if login_resp.status_code == 200:
            log("   [OK] Login successful with initial password")
        else:
            log(f"   [FAIL] Login failed: {login_resp.text}")
            return
    except Exception as e:
        log(f"   [ERROR] Error: {e}")
        return
    
    # 4. FORGOT PASSWORD TEST
    log("\n4. Testing FORGOT PASSWORD...")
    forgot_data = {'email': email}
    try:
        forgot_resp = requests.post(f'{BASE_URL}/forgot-password/', json=forgot_data)
        log(f"   Status: {forgot_resp.status_code}")
        if forgot_resp.status_code == 204:
            log("   [OK] Forgot password request successful")
            # Get the OTP that was generated
            user.refresh_from_db()
            reset_otp = user.otp_code
            log(f"   Reset OTP: {reset_otp}")
        else:
            log(f"   [FAIL] Request failed")
            return
    except Exception as e:
        log(f"   [ERROR] Error: {e}")
        return
    
    # 5. RESET PASSWORD TEST
    log("\n5. Testing RESET PASSWORD...")
    reset_data = {
        'email': email,
        'otp': reset_otp,
        'new_password': new_password
    }
    try:
        reset_resp = requests.post(f'{BASE_URL}/reset-password/', json=reset_data)
        log(f"   Status: {reset_resp.status_code}")
        if reset_resp.status_code == 200:
            log("   [OK] Password reset successful")
            user.refresh_from_db()
            log(f"   User is_active after reset: {user.is_active}")
        else:
            log(f"   [FAIL] Reset failed: {reset_resp.text}")
            return
    except Exception as e:
        log(f"   [ERROR] Error: {e}")
        return
    
    # 6. LOGIN TEST (with new password)
    log("\n6. Testing LOGIN with NEW password...")
    login_new_data = {
        'email': email,
        'password': new_password
    }
    try:
        login_new_resp = requests.post(f'{BASE_URL}/login/', json=login_new_data)
        log(f"   Status: {login_new_resp.status_code}")
        if login_new_resp.status_code == 200:
            log("   [OK] LOGIN SUCCESSFUL with new password!")
            log("\n========== ALL TESTS PASSED! ==========")
        else:
            log(f"   [FAIL] LOGIN FAILED with new password: {login_new_resp.text}")
            log("\n========== TEST FAILED! ==========")
    except Exception as e:
        log(f"   [ERROR] Error: {e}")
        log("\n========== TEST FAILED! ==========")

if __name__ == '__main__':
    test_full_flow()
