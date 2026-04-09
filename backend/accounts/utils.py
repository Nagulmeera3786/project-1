import random
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
import logging
import time

logger = logging.getLogger(__name__)

# for SMS you could use twilio.rest.Client

def generate_otp():
    return f'{random.randint(100000, 999999)}'

def send_otp_via_email(user, otp):
    """Send OTP to user email with production-friendly fail-fast defaults."""
    max_attempts = max(1, int(getattr(settings, 'OTP_EMAIL_MAX_ATTEMPTS', 1) or 1))
    retry_delay_ms = max(0, int(getattr(settings, 'OTP_EMAIL_RETRY_DELAY_MS', 0) or 0))
    subject = getattr(settings, 'OTP_EMAIL_SUBJECT', 'Your verification code')
    message = (
        f'Your OTP is {otp}\n\n'
        'This code will expire in 10 minutes.\n\n'
        'If you did not request this code, ignore this email.'
    )

    for attempt in range(1, max_attempts + 1):
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info("OTP email sent to %s on attempt %s", user.email, attempt)
            return True
        except Exception as exc:
            logger.exception("Email sending error for user %s on attempt %s: %s", user.email, attempt, exc)
            if attempt < max_attempts and retry_delay_ms > 0:
                time.sleep(retry_delay_ms / 1000)
    return False

def otp_is_valid(user, otp, minutes=10):
    if not user.otp_code or not user.otp_created:
        return False
    if str(user.otp_code).strip() != str(otp).strip():
        return False
    if timezone.now() > user.otp_created + timedelta(minutes=minutes):
        return False
    return True


def send_admin_promotion_confirmation_email(user, confirmation_token):
    """Send admin promotion confirmation email with approval link."""
    import os

    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    confirmation_url = f"{frontend_url}/api/auth/confirm-admin-promotion/?token={confirmation_token}&user_id={user.id}"

    subject = "Admin Promotion Confirmation Required"
    message = (
        f"Hello {user.first_name or user.username},\n\n"
        "You have been nominated for ADMIN promotion in the SMS Management System.\n\n"
        "To confirm and accept admin privileges, click the link below:\n\n"
        f"{confirmation_url}\n\n"
        "This link will expire in 24 hours.\n\n"
        "If you did not request this promotion or did not expect this email, "
        "please contact the system administrator.\n\n"
        "Best regards,\n"
        "SMS Management System"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info("Admin promotion confirmation email sent to %s", user.email)
        return True
    except Exception as exc:
        logger.exception("Failed to send admin promotion confirmation email to %s: %s", user.email, exc)
        return False

