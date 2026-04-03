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
    """Send OTP to user email"""
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        try:
            send_mail(
                subject='Your verification code',
                message=f'Your OTP is {otp}\n\nThis code will expire in 10 minutes.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            logger.info("OTP email sent to %s on attempt %s", user.email, attempt)
            return True
        except Exception:
            logger.exception("Email sending error for user %s on attempt %s", user.email, attempt)
            if attempt < max_attempts:
                time.sleep(1.5)
    return False

def otp_is_valid(user, otp, minutes=10):
    if not user.otp_code or not user.otp_created:
        return False
    if str(user.otp_code).strip() != str(otp).strip():
        return False
    if timezone.now() > user.otp_created + timedelta(minutes=minutes):
        return False
    return True
