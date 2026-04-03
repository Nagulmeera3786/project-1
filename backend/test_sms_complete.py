#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Comprehensive SMS Feature Test Script
Tests all SMS endpoints and functionality
"""

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
from accounts.models import SMSCredential, SMSMessage

User = get_user_model()
BASE_URL = 'http://localhost:8000/api/auth'


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def test_sms_feature():
    log("\n" + "="*70)
    log("SMS FEATURE COMPREHENSIVE TEST")
    log("="*70 + "\n")

    admin_email = 'mrm53451@gmail.com'
    admin_password = 'AdminSMS123!'
    test_user_email = 'testuser@example.com'
    test_user_password = 'TestUser123!'

    # Step 1: Ensure admin user exists
    log("1. Setting up admin user...")
    admin_user = User.objects.filter(email__iexact=admin_email).order_by('-is_active', '-id').first()
    if admin_user:
        admin_user.set_password(admin_password)
        admin_user.is_active = True
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        log("   ✓ Admin user verified")
    else:
        admin_user = User.objects.create_superuser(
            email=admin_email,
            username='admin_sms',
            password=admin_password
        )
        log("   ✓ Admin user created")

    # Step 2: Create test user
    log("2. Setting up test user...")
    test_user = User.objects.filter(email__iexact=test_user_email).order_by('-id').first()
    if test_user:
        if not test_user.phone_number:
            test_user.phone_number = '+919876543210'
        if not test_user.is_sms_enabled:
            test_user.is_sms_enabled = True
        test_user.set_password(test_user_password)
        test_user.save()
        log("   ✓ Test user exists")
    else:
        test_user = User.objects.create_user(
            email=test_user_email,
            username='testuser',
            password=test_user_password,
            is_sms_enabled=True,
            phone_number='+919876543210'
        )
        log("   ✓ Test user created")

    # Step 3: Admin login
    log("3. Admin login...")
    try:
        login_resp = requests.post(
            f'{BASE_URL}/login/',
            json={'email': admin_email, 'password': admin_password},
            timeout=5
        )
        if login_resp.status_code == 200:
            access_token = login_resp.json()['access']
            headers = {'Authorization': f'Bearer {access_token}'}
            log(f"   ✓ Login successful (Token: {access_token[:20]}...)")
        else:
            log(f"   ✗ Login failed: {login_resp.status_code}")
            return
    except Exception as e:
        log(f"   ✗ Login error: {e}")
        return

    # Step 4: Test GET credentials (should be empty initially)
    log("4. Testing GET /api/auth/sms/credentials/...")
    try:
        cred_resp = requests.get(f'{BASE_URL}/sms/credentials/', headers=headers, timeout=5)
        if cred_resp.status_code == 200:
            log(f"   ✓ GET successful (Status: {cred_resp.status_code})")
            log(f"   Response: {json.dumps(cred_resp.json(), indent=2)}")
        else:
            log(f"   ✗ GET failed: {cred_resp.status_code}")
            log(f"   Response: {cred_resp.text}")
    except Exception as e:
        log(f"   ✗ GET error: {e}")

    # Step 5: Test PATCH credentials (save test credentials)
    log("5. Testing PATCH /api/auth/sms/credentials/...")
    test_cred_data = {
        'user': 'test_profile_id',
        'password': 'test_password_123',
        'sender_ids': ['TEST', 'ABC', 'DEMO']
    }
    try:
        patch_resp = requests.patch(
            f'{BASE_URL}/sms/credentials/',
            json=test_cred_data,
            headers=headers,
            timeout=5
        )
        if patch_resp.status_code in [200, 201]:
            log(f"   ✓ PATCH successful (Status: {patch_resp.status_code})")
            log(f"   Response: {json.dumps(patch_resp.json(), indent=2)}")
        else:
            log(f"   ✗ PATCH failed: {patch_resp.status_code}")
            log(f"   Response: {patch_resp.text}")
    except Exception as e:
        log(f"   ✗ PATCH error: {e}")
        import traceback
        traceback.print_exc()

    # Step 6: Verify credentials were saved
    log("6. Verifying saved credentials...")
    try:
        cred = SMSCredential.objects.filter(is_active=True).first()
        if cred:
            log(f"   ✓ Credentials found in database")
            log(f"   - User: {cred.user}")
            log(f"   - Sender IDs: {cred.sender_ids}")
        else:
            log(f"   ✗ Credentials not found in database")
    except Exception as e:
        log(f"   ✗ Database query error: {e}")

    # Step 7: Test SMS send
    log("7. Testing POST /api/auth/sms/send/...")
    sms_data = {
        'display_sender_id': 'TEST',
        'message_content': 'This is a test message',
        'recipient_number': '+919876543210',
        'recipient_user_id': test_user.id
    }
    try:
        send_resp = requests.post(
            f'{BASE_URL}/sms/send/',
            json=sms_data,
            headers=headers,
            timeout=5
        )
        if send_resp.status_code == 201:
            log(f"   ✓ SMS sent successfully (Status: {send_resp.status_code})")
            log(f"   Response: {json.dumps(send_resp.json(), indent=2)}")
        else:
            log(f"   ✗ SMS send failed: {send_resp.status_code}")
            log(f"   Response: {send_resp.text}")
    except Exception as e:
        log(f"   ✗ SMS send error: {e}")

    # Step 8: Test get messages
    log("8. Testing GET /api/auth/sms/messages/...")
    try:
        msgs_resp = requests.get(
            f'{BASE_URL}/sms/messages/',
            headers=headers,
            timeout=5
        )
        if msgs_resp.status_code == 200:
            messages = msgs_resp.json()
            log(f"   ✓ Messages retrieved (Status: {msgs_resp.status_code})")
            log(f"   Total messages: {len(messages)}")
            if len(messages) > 0:
                log(f"   First message: {json.dumps(messages[0], indent=2)}")
        else:
            log(f"   ✗ Messages retrieval failed: {msgs_resp.status_code}")
    except Exception as e:
        log(f"   ✗ Messages retrieval error: {e}")

    # Step 9: Test user SMS eligibility toggle
    log("9. Testing PATCH /api/auth/sms/users/<id>/eligibility/...")
    try:
        eligibility_resp = requests.patch(
            f'{BASE_URL}/sms/users/{test_user.id}/eligibility/',
            json={'is_sms_enabled': False},
            headers=headers,
            timeout=5
        )
        if eligibility_resp.status_code == 200:
            log(f"   ✓ Eligibility toggled (Status: {eligibility_resp.status_code})")
            log(f"   Response: {json.dumps(eligibility_resp.json(), indent=2)}")
        else:
            log(f"   ✗ Toggle failed: {eligibility_resp.status_code}")
    except Exception as e:
        log(f"   ✗ Toggle error: {e}")

    # Step 10: Test admin users list
    log("10. Testing GET /api/auth/sms/admin/users/...")
    try:
        users_resp = requests.get(
            f'{BASE_URL}/sms/admin/users/',
            headers=headers,
            timeout=5
        )
        if users_resp.status_code == 200:
            users = users_resp.json()
            log(f"   ✓ Users retrieved (Status: {users_resp.status_code})")
            log(f"   Total users: {len(users)}")
        else:
            log(f"   ✗ Users retrieval failed: {users_resp.status_code}")
    except Exception as e:
        log(f"   ✗ Users retrieval error: {e}")

    log("\n" + "="*70)
    log("TEST COMPLETE!")
    log("="*70 + "\n")
    
    # Database summary
    log("DATABASE SUMMARY:")
    log(f"  - Total Users: {User.objects.count()}")
    log(f"  - SMS Credentials: {SMSCredential.objects.count()}")
    log(f"  - SMS Messages: {SMSMessage.objects.count()}")
    log("")


if __name__ == '__main__':
    try:
        test_sms_feature()
    except Exception as e:
        log(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
