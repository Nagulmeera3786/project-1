#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import django
import requests
import json
from datetime import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
BASE_URL = 'http://localhost:8000/api/auth'


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def ensure_admin_user(email='admin@example.com', password='AdminPass123'):
    user, created = User.objects.get_or_create(
        email=email,
        defaults={'username': email, 'is_staff': True, 'is_active': True},
    )
    if created or not user.check_password(password):
        user.set_password(password)
    user.is_staff = True
    user.is_active = True
    user.save()
    return user


def test_admin_endpoints():
    log("\n=== ADMIN LIST & EXPORT TEST ===")

    admin_email = 'admin@example.com'
    admin_password = 'AdminPass123'

    # ensure admin user exists
    ensure_admin_user(admin_email, admin_password)

    # obtain JWT token via login
    resp = requests.post(
        f"{BASE_URL}/login/",
        json={'email': admin_email, 'password': admin_password},
    )
    log(f"Login status: {resp.status_code}")
    if resp.status_code != 200:
        print("Failed to login as admin - aborting tests.")
        return
    tokens = resp.json()
    access = tokens.get('access')
    headers = {'Authorization': f'Bearer {access}'}

    # 1. list users
    list_resp = requests.get(f"{BASE_URL}/admin/users/", headers=headers)
    log(f"Users list status: {list_resp.status_code}")
    if list_resp.status_code == 200:
        users = list_resp.json()
        log(f"Number of users returned: {len(users)}")
    else:
        log(f"Users list failed: {list_resp.text}")
        return

    # 2. export users (should return excel blob)
    export_resp = requests.get(f"{BASE_URL}/admin/users/export/", headers=headers)
    log(f"Export status: {export_resp.status_code}")
    if export_resp.status_code == 200:
        content_type = export_resp.headers.get('Content-Type', '')
        log(f"Content-Type: {content_type}")
        if 'spreadsheetml' in content_type:
            log("✓ Received Excel file")
            # save to disk for manual inspection
            filename = f"users-export-test-{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
            with open(filename, 'wb') as f:
                f.write(export_resp.content)
            log(f"Saved file to {filename}")
        else:
            log("Unexpected content type when exporting users")
    else:
        log(f"Export failed: {export_resp.text}")


if __name__ == '__main__':
    test_admin_endpoints()
