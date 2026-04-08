#!/usr/bin/env python
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from accounts.utils import send_otp_via_email
from django.contrib.auth import get_user_model
import time

User = get_user_model()

def main():
    print("\n========== OTP EMAIL SENDING DIAGNISTICS ==========\n")

    test_email = "emailtest123@gmail.com"
    User.objects.filter(email=test_email).delete()

    user = User.objects.create(
        username=test_email,
        email=test_email,
        password='testpass123'
    )

    test_otp = "123456"
    print(f"1. Testing OTP email send to: {test_email}")
    print(f"   Using OTP: {test_otp}")

    result = send_otp_via_email(user, test_otp)

    if result:
        print(f"\n   [SUCCESS] Email was sent successfully!")
        print(f"   Check inbox at: {test_email}")
    else:
        print(f"\n   [FAILED] Email sending failed - check errors above")

    user.delete()
    print("\n========== END DIAGNISTICS ==========\n")


if __name__ == '__main__':
    main()

