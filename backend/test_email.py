import os
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def main():
    print("=" * 60)
    print("EMAIL CONFIGURATION TEST")
    print("=" * 60)
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"EMAIL_HOST_PASSWORD: {'*' * 10 if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
    print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print("=" * 60)

    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        print("❌ ERROR: EMAIL_HOST_USER or EMAIL_HOST_PASSWORD not set in .env")
        print("Backend will use CONSOLE EMAIL (emails won't be sent)")
    else:
        print("✓ Email credentials are configured")
        print("\nAttempting to send test email...")
        try:
            send_mail(
                subject='ABC Company - Test OTP',
                message='Your test OTP is 123456',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.EMAIL_HOST_USER],
                fail_silently=False,
            )
            print("✓ TEST EMAIL SENT SUCCESSFULLY!")
            print(f"Check your inbox at: {settings.EMAIL_HOST_USER}")
        except Exception as e:
            print(f"❌ ERROR SENDING EMAIL: {e}")
            print(f"Error type: {type(e).__name__}")


if __name__ == '__main__':
    main()

