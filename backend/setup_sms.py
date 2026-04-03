#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Setup script to initialize admin user and SMS configuration
Run this after database migration: python manage.py migrate
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import SMSCredential

User = get_user_model()


def create_admin_user():
    """Create admin user with email mrm53451@gmail.com"""
    admin_email = 'mrm53451@gmail.com'
    admin_username = 'admin_sms'
    admin_password = 'AdminSMS123!'  # Change this to a secure password
    
    try:
        user = User.objects.get(email=admin_email)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"✓ Admin user ({admin_email}) updated with staff/superuser privileges")
        return user
    except User.DoesNotExist:
        user = User.objects.create_superuser(
            email=admin_email,
            username=admin_username,
            password=admin_password,
            is_staff=True,
            is_superuser=True
        )
        print(f"✓ Admin user created: {admin_email}")
        print(f"  Username: {admin_username}")
        print(f"  Password: {admin_password}")
        print(f"  Please change the password after first login!")
        return user


def initialize_sms_credentials():
    """Initialize empty SMS credentials for admin to fill"""
    try:
        cred = SMSCredential.objects.filter(is_active=True).first()
        if not cred:
            cred = SMSCredential.objects.create(
                user='',
                password='',
                sender_ids=[],
                is_active=True
            )
            print("✓ SMS Credential slot created (empty)")
            print("  Admin needs to fill this in the Admin SMS Credentials page")
        else:
            print("✓ SMS Credentials already exist")
    except Exception as e:
        print(f"✗ Error initializing SMS credentials: {e}")


def main():
    print("\n" + "="*60)
    print("ABC Company - SMS Feature Setup")
    print("="*60 + "\n")
    
    try:
        create_admin_user()
        initialize_sms_credentials()
        
        print("\n" + "="*60)
        print("SETUP COMPLETE!")
        print("="*60)
        print("\nNext Steps:")
        print("1. Run Django server: python manage.py runserver")
        print("2. Login as admin: mrm53451@gmail.com")
        print("3. Go to /admin/sms/credentials")
        print("4. Enter your SMS provider credentials:")
        print("   - Profile ID (User)")
        print("   - Password/API Key")
        print("   - Sender IDs (comma-separated)")
        print("\n⚠️  IMPORTANT: Your credentials are stored securely!")
        print("   They are never logged or exposed.\n")
        
    except Exception as e:
        print(f"\n✗ Setup failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
