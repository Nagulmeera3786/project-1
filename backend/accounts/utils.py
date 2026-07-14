import random
import math
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
import logging
import time

logger = logging.getLogger(__name__)

_GSM_7_BASIC_CHARSET = set(
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ "
    "!\"#¤%&'()*+,-./"
    "0123456789:;<=>?"
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
)
_GSM_7_EXTENDED_CHARSET = {'^', '{', '}', '\\', '[', '~', ']', '|', '€'}


def calculate_sms_segments(text, max_segments=10):
    message = str(text or '')
    if not message:
        return {
            'encoding': 'GSM-7',
            'length_units': 0,
            'single_limit': 160,
            'concat_limit': 153,
            'per_segment_limit': 160,
            'segments': 0,
            'max_units': 160,
            'is_multipart': False,
        }

    is_gsm7 = True
    septet_length = 0
    for ch in message:
        if ch in _GSM_7_BASIC_CHARSET:
            septet_length += 1
        elif ch in _GSM_7_EXTENDED_CHARSET:
            # GSM-7 extension table characters consume two septets.
            septet_length += 2
        else:
            is_gsm7 = False
            break

    if is_gsm7:
        encoding = 'GSM-7'
        length_units = septet_length
        single_limit = 160
        concat_limit = 153
    else:
        encoding = 'UCS-2'
        length_units = len(message)
        single_limit = 70
        concat_limit = 67

    if length_units <= single_limit:
        segments = 1
        per_segment_limit = single_limit
    else:
        segments = int(1 + math.ceil((length_units - single_limit) / float(concat_limit)))
        per_segment_limit = concat_limit

    if segments > int(max_segments or 10):
        raise ValueError(
            f'Message is too long: {segments} SMS segments detected. '
            f'Maximum allowed is {int(max_segments or 10)} segments.'
        )

    max_units = (
        single_limit
        if int(max_segments or 10) <= 1
        else single_limit + ((int(max_segments or 10) - 1) * concat_limit)
    )

    return {
        'encoding': encoding,
        'length_units': int(length_units),
        'single_limit': int(single_limit),
        'concat_limit': int(concat_limit),
        'per_segment_limit': int(per_segment_limit),
        'segments': int(segments),
        'max_units': int(max_units),
        'is_multipart': bool(segments > 1),
    }

# for SMS you could use twilio.rest.Client

def generate_otp():
    return f'{random.randint(100000, 999999)}'

def send_otp_via_email(user, otp):
    """Send OTP to either a user object or a raw email string."""
    max_attempts = max(1, int(getattr(settings, 'OTP_EMAIL_MAX_ATTEMPTS', 1) or 1))
    retry_delay_ms = max(0, int(getattr(settings, 'OTP_EMAIL_RETRY_DELAY_MS', 0) or 0))
    subject = getattr(settings, 'OTP_EMAIL_SUBJECT', 'Your verification code')
    recipient_email = (getattr(user, 'email', None) or str(user).strip() or '').strip().lower()
    if not recipient_email:
        logger.error("OTP email skipped because recipient email is missing")
        return False

    # Some SMTP providers reject messages if From does not match authenticated mailbox.
    from_email = (
        str(getattr(settings, 'DEFAULT_FROM_EMAIL', '') or '').strip()
        or str(getattr(settings, 'EMAIL_HOST_USER', '') or '').strip()
        or 'no-reply@example.com'
    )

    message = (
        f'Your OTP is {otp}\n\n'
        'This code will expire in 10 minutes.\n\n'
        'If you did not request this code, ignore this email.'
    )

    for attempt in range(1, max_attempts + 1):
        try:
            sent_count = send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=[recipient_email],
                fail_silently=False,
            )
            if int(sent_count or 0) <= 0:
                raise Exception('SMTP backend did not accept OTP email')
            logger.info("OTP email sent to %s on attempt %s", recipient_email, attempt)
            return True
        except Exception as exc:
            fallback_sender = str(getattr(settings, 'EMAIL_HOST_USER', '') or '').strip()
            if fallback_sender and fallback_sender != from_email:
                try:
                    sent_count = send_mail(
                        subject=subject,
                        message=message,
                        from_email=fallback_sender,
                        recipient_list=[recipient_email],
                        fail_silently=False,
                    )
                    if int(sent_count or 0) > 0:
                        logger.info(
                            "OTP email sent to %s on attempt %s using fallback sender",
                            recipient_email,
                            attempt,
                        )
                        return True
                except Exception:
                    pass

            logger.exception("Email sending error for user %s on attempt %s: %s", recipient_email, attempt, exc)
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

