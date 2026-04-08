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

