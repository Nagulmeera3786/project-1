import os
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from django.conf import settings
from django.core.mail import send_mail
import ssl

def main():
    print("=" * 70)
    print("COMPREHENSIVE EMAIL CONFIGURATION CHECK")
    print("=" * 70)

    print("\n1. ENVIRONMENT VARIABLES:")
    print(f"   EMAIL_HOST: {os.getenv('EMAIL_HOST', 'NOT SET')}")
    print(f"   EMAIL_PORT: {os.getenv('EMAIL_PORT', 'NOT SET')}")
    print(f"   EMAIL_USE_TLS: {os.getenv('EMAIL_USE_TLS', 'NOT SET')}")
    print(f"   EMAIL_USER: {os.getenv('EMAIL_USER', 'NOT SET')}")
    print(f"   EMAIL_PASSWORD: {'SET' if os.getenv('EMAIL_PASSWORD') else 'NOT SET'}")
    print(f"   EMAIL_FROM: {os.getenv('EMAIL_FROM', 'NOT SET')}")

    print("\n2. DJANGO SETTINGS:")
    print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"   EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"   EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"   EMAIL_HOST_PASSWORD: {'SET' if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
    print(f"   DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

    print("\n3. CHECKING EMAIL BACKEND:")
    if 'console' in settings.EMAIL_BACKEND:
        print("   ❌ USING CONSOLE BACKEND (emails not sent to real inboxes)")
        print("   This means EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is not set!")
    elif 'smtp' in settings.EMAIL_BACKEND:
        print("   ✓ USING SMTP BACKEND (should send real emails)")
    else:
        print(f"   ? UNKNOWN: {settings.EMAIL_BACKEND}")

    print("\n4. TESTING SMTP CONNECTION:")
    try:
        import smtplib
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=5)
        print(f"   ✓ Connected to {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")

        if settings.EMAIL_USE_TLS:
            server.starttls()
            print("   ✓ TLS enabled")

        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        print(f"   ✓ Logged in as {settings.EMAIL_HOST_USER}")

        server.quit()
        print("   ✓ Connection test PASSED")
    except Exception as e:
        print(f"   ❌ Connection FAILED: {e}")

    print("\n5. ATTEMPTING TEST EMAIL SEND:")
    try:
        import smtplib
        import ssl

        from django.core.mail import get_connection, send_mail

        connection = get_connection()
        original_create_connection = ssl.create_default_context

        def create_unverified_context(*args, **kwargs):
            ctx = original_create_connection(*args, **kwargs)
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            return ctx

        ssl.create_default_context = create_unverified_context

        try:
            send_mail(
                subject='ABC Company - Test OTP Email',
                message='This is a test OTP email. If you receive this, emails are working!\n\nTest OTP: 123456',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.EMAIL_HOST_USER],
                fail_silently=False,
                connection=connection,
            )
            print("   ✓ TEST EMAIL SENT!")
            print(f"   Check email: {settings.EMAIL_HOST_USER}")
            print("   (Check spam folder if not in inbox)")
        finally:
            ssl.create_default_context = original_create_connection
            if connection:
                connection.close()
    except Exception as e:
        print(f"   ❌ EMAIL SEND FAILED: {e}")
        print(f"   Error type: {type(e).__name__}")

    print("\n6. WHAT TO DO:")
    print("   a) Check your email (including spam folder)")
    print("   b) If you got the test email, OTPs should work!")
    print("   c) If no email, check:")
    print("      - EMAIL_USER is correct Gmail")
    print("      - EMAIL_PASSWORD is app password (not Gmail password)")
    print("      - 2FA is enabled on Gmail")
    print("      - .env file exists and has values")

    print("\n" + "=" * 70)


if __name__ == '__main__':
    main()

