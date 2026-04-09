from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Q, Count, F
from django.http import HttpResponseRedirect, Http404
from django.views import View
import requests
import time
import re
import random
import string
import uuid
import socket
from datetime import datetime, timezone as dt_timezone, timedelta
from zoneinfo import ZoneInfo, available_timezones
from .serializers import (
    SignupSerializer, OTPVerifySerializer, LoginSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    SMSMessageSerializer, SMSSendSerializer, SMSCredentialSerializer,
    UserSMSEligibilitySerializer, SMSMessageStatusSerializer,
    SMSContactGroupSerializer, SMSContactGroupCreateSerializer,
    SMSShortURLSerializer,
    NotificationRecipientPreviewSerializer,
    AdminNotificationSendSerializer,
    AdminNotificationHistorySerializer,
    UserNotificationSerializer,
)
from .utils import generate_otp, send_otp_via_email, otp_is_valid
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import (
    SMSMessage,
    SMSCredential,
    SMSContactGroup,
    SMSContact,
    SMSShortURL,
    FreeTrialVerifiedNumber,
    InternalNotification,
    InternalNotificationRecipient,
)

User = get_user_model()


def _is_primary_admin_email(email):
    return email.strip().lower() == getattr(settings, 'PRIMARY_ADMIN_EMAIL', '').strip().lower()


def _has_primary_admin_access(user):
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    return bool(
        _is_primary_admin_email(getattr(user, 'email', '') or '')
        and getattr(user, 'is_active', False)
        and getattr(user, 'is_staff', False)
        and getattr(user, 'is_superuser', False)
    )


def _primary_admin_guard(request):
    if _has_primary_admin_access(request.user):
        return None
    return Response({'detail': 'Primary admin access required'}, status=status.HTTP_403_FORBIDDEN)


def _promote_primary_admin(user):
    if _is_primary_admin_email(user.email):
        changed = False
        if not user.is_staff:
            user.is_staff = True
            changed = True
        if not user.is_superuser:
            user.is_superuser = True
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True
        if not user.is_sms_enabled:
            user.is_sms_enabled = True
            changed = True
        if changed:
            user.save()


def _find_user_by_email(email):
    normalized_email = (email or '').strip().lower()
    if not normalized_email:
        return None
    return User.objects.filter(email__iexact=normalized_email).order_by('-is_active', '-id').first()


def _otp_email_diagnostics(email_sent):
    configured_provider = str(getattr(settings, 'EMAIL_PROVIDER', '') or '').strip().lower()
    backend = str(getattr(settings, 'EMAIL_BACKEND', '') or '').strip()
    host = str(getattr(settings, 'EMAIL_HOST', '') or '').strip()

    if configured_provider:
        provider = configured_provider
    elif 'sendgrid' in host.lower():
        provider = 'sendgrid'
    elif 'mailgun' in host.lower():
        provider = 'mailgun'
    elif 'gmail' in host.lower() or 'google' in host.lower():
        provider = 'gmail'
    elif host:
        provider = 'custom-smtp'
    else:
        provider = 'unknown'

    diagnostics = {
        'otp_generated': True,
        'email_delivery': {
            'sent': bool(email_sent),
            'provider': provider,
            'backend': backend,
            'host': host,
        },
    }

    if not email_sent:
        diagnostics['error_code'] = 'OTP_EMAIL_DELIVERY_FAILED'
        diagnostics['next_step'] = 'Check Render logs and provider credentials/API key.'

    return diagnostics


def _get_sms_provider_config():
    cred = SMSCredential.objects.filter(is_active=True).order_by('-updated_at', '-id').first()
    if cred:
        db_user = (cred.user or '').strip()
        db_password = (cred.password or '').strip()
        if db_user and db_password:
            db_sender_ids = [str(item).strip() for item in (cred.sender_ids or []) if str(item).strip()]
            return {
                'credential': cred,
                'user': db_user,
                'password': db_password,
                'sender_ids': db_sender_ids,
                'source': 'database',
            }

    env_user = getattr(settings, 'SMS_PROVIDER_USER', '').strip()
    env_password = getattr(settings, 'SMS_PROVIDER_PASSWORD', '').strip()
    sender_ids = [str(item).strip() for item in getattr(settings, 'SMS_DEFAULT_SENDER_IDS', []) if str(item).strip()]
    if env_user and env_password:
        return {
            'credential': None,
            'user': env_user,
            'password': env_password,
            'sender_ids': sender_ids,
            'source': 'env',
        }

    return None


def _get_admin_managed_sms_provider_config():
    cred = SMSCredential.objects.filter(is_active=True).order_by('-updated_at', '-id').first()
    if cred:
        db_user = (cred.user or '').strip()
        db_password = (cred.password or '').strip()
        db_sender_ids = [str(item).strip() for item in (cred.sender_ids or []) if str(item).strip()]
        db_free_trial_sender_id = str(getattr(cred, 'free_trial_default_sender_id', '') or '').strip()
        if db_user and db_password:
            return {
                'credential': cred,
                'user': db_user,
                'password': db_password,
                'sender_ids': db_sender_ids,
                'free_trial_default_sender_id': db_free_trial_sender_id,
                'source': 'database',
            }

    env_user = getattr(settings, 'SMS_PROVIDER_USER', '').strip()
    env_password = getattr(settings, 'SMS_PROVIDER_PASSWORD', '').strip()
    env_sender_ids = [str(item).strip() for item in getattr(settings, 'SMS_DEFAULT_SENDER_IDS', []) if str(item).strip()]
    env_free_trial_sender_id = str(getattr(settings, 'SMS_FREE_TRIAL_DEFAULT_SENDER_ID', '') or '').strip()
    if env_user and env_password:
        return {
            'credential': None,
            'user': env_user,
            'password': env_password,
            'sender_ids': env_sender_ids,
            'free_trial_default_sender_id': env_free_trial_sender_id,
            'source': 'env',
        }

    return None


def _get_free_trial_mediator_user():
    primary_admin_email = getattr(settings, 'PRIMARY_ADMIN_EMAIL', '').strip().lower()
    if primary_admin_email:
        primary_admin = User.objects.filter(
            email__iexact=primary_admin_email,
            is_staff=True,
            is_active=True,
        ).first()
        if primary_admin:
            return primary_admin

    return User.objects.filter(
        email__iexact=getattr(settings, 'PRIMARY_ADMIN_EMAIL', '').strip().lower(),
        is_staff=True,
        is_superuser=True,
        is_active=True,
    ).order_by('id').first()


def _resolve_free_trial_sender_id(user, provider_config):
    available_sender_ids = [
        str(item).strip()
        for item in (provider_config.get('sender_ids') or [])
        if str(item).strip()
    ]
    if not available_sender_ids:
        raise ValueError('Free trial sender configuration is unavailable')

    trial_sender_id = str(provider_config.get('free_trial_default_sender_id') or '').strip()
    user_sender_id = str(getattr(user, 'free_trial_sender_id', '') or '').strip() if user else ''

    if trial_sender_id and trial_sender_id in available_sender_ids:
        resolved_sender_id = trial_sender_id
    elif user_sender_id and user_sender_id in available_sender_ids:
        resolved_sender_id = user_sender_id
    else:
        # Auto-fallback lets normal users use free-trial flow even if admin skipped selecting a dedicated default.
        resolved_sender_id = available_sender_ids[0]

    if user and not _has_primary_admin_access(user) and user_sender_id != resolved_sender_id:
        try:
            user.free_trial_sender_id = resolved_sender_id
            user.save(update_fields=['free_trial_sender_id'])
        except Exception:
            pass

    return resolved_sender_id


def _normalize_sender_id(sender_id_type, sender_id):
    normalized_type = (sender_id_type or 'alphanumeric').strip().lower()
    if normalized_type not in ['numeric', 'alphanumeric']:
        raise ValueError('Invalid sender ID type. Allowed values: numeric, alphanumeric')

    raw_sender_id = (sender_id or '').strip()
    if not raw_sender_id:
        return normalized_type, ''

    if normalized_type == 'numeric':
        if not raw_sender_id.isdigit():
            raise ValueError('Numeric sender ID must contain only digits')
        if len(raw_sender_id) < 6 or len(raw_sender_id) > 15:
            raise ValueError('Numeric sender ID length must be between 6 and 15 digits')
        return normalized_type, raw_sender_id

    normalized_sender_id = raw_sender_id.upper()
    if not re.fullmatch(r'[A-Z0-9]+', normalized_sender_id):
        raise ValueError('Alphanumeric sender ID can contain only letters and numbers')
    if len(normalized_sender_id) < 3 or len(normalized_sender_id) > 11:
        raise ValueError('Alphanumeric sender ID length must be between 3 and 11 characters')
    return normalized_type, normalized_sender_id


def _sender_id_exists(sender_id, exclude_user_id=None):
    if not sender_id:
        return False
    queryset = User.objects.filter(sender_id__iexact=sender_id)
    if exclude_user_id:
        queryset = queryset.exclude(id=exclude_user_id)
    return queryset.exists()


def _build_sender_id_suggestions(sender_id, sender_id_type, exclude_user_id=None, limit=4):
    normalized_type = (sender_id_type or 'alphanumeric').strip().lower()
    existing_sender_ids = set(
        User.objects.exclude(sender_id__isnull=True)
        .exclude(sender_id='')
        .exclude(id=exclude_user_id if exclude_user_id else -1)
        .values_list('sender_id', flat=True)
    )
    existing_sender_ids = {str(item).upper() for item in existing_sender_ids}

    suggestions = []

    if normalized_type == 'numeric':
        base_digits = ''.join(ch for ch in (sender_id or '') if ch.isdigit())
        while len(base_digits) < 6:
            base_digits += str(random.randint(0, 9))
        base_prefix = base_digits[:10]

        for index in range(1, 50):
            candidate = f"{base_prefix}{index:02d}"[:15]
            if candidate.upper() not in existing_sender_ids and candidate not in suggestions:
                suggestions.append(candidate)
            if len(suggestions) >= limit:
                break
    else:
        clean_base = ''.join(ch for ch in (sender_id or '').upper() if ch.isalnum())
        if not clean_base:
            clean_base = 'SENDER'
        base_prefix = clean_base[:8]

        for index in range(1, 70):
            suffix = f"{index:02d}"
            candidate = f"{base_prefix}{suffix}"[:11]
            if len(candidate) < 3:
                extra = ''.join(random.choice(string.ascii_uppercase) for _ in range(3 - len(candidate)))
                candidate = f"{candidate}{extra}"
            if candidate.upper() not in existing_sender_ids and candidate not in suggestions:
                suggestions.append(candidate)
            if len(suggestions) >= limit:
                break

    return suggestions


def _normalize_phone_number(raw_value):
    digits = ''.join(ch for ch in str(raw_value or '') if ch.isdigit())
    return digits if len(digits) >= 10 else ''


def _render_personalized_template(template_text, row_values):
    rendered = str(template_text or '')
    for index, value in enumerate(row_values, start=1):
        rendered = rendered.replace(f'#{index}#', str(value if value is not None else '').strip())
    return rendered.strip()


def _extract_phone_from_row(row_values):
    for value in row_values:
        normalized = _normalize_phone_number(value)
        if normalized:
            return normalized
    return ''


def _generate_short_code(length=7):
    alphabet = string.ascii_letters + string.digits
    return ''.join(random.choice(alphabet) for _ in range(length))


def _format_utc_offset(offset_delta):
    if offset_delta is None:
        return 'UTC+00:00', '+0.00', 0

    total_minutes = int(offset_delta.total_seconds() // 60)
    sign = '+' if total_minutes >= 0 else '-'
    abs_minutes = abs(total_minutes)
    hours, minutes = divmod(abs_minutes, 60)
    human = f'UTC{sign}{hours:02d}:{minutes:02d}'
    compact = f'{sign}{hours}.{minutes:02d}'
    return human, compact, total_minutes


FREE_TRIAL_MESSAGE_LIMIT = 3
FREE_TRIAL_OTP_EXPIRY_MINUTES = 10


def _get_users_for_notification_filter(audience_filter):
    audience_filter = (audience_filter or 'all_users').strip().lower()
    users = User.objects.all()

    if audience_filter == 'all_users':
        return users
    if audience_filter == 'verified_users':
        return users.filter(is_active=True)
    if audience_filter == 'not_verified_users':
        return users.filter(is_active=False)
    if audience_filter == 'new_joiners':
        return users.filter(date_joined__gte=timezone.now() - timedelta(days=7))
    if audience_filter == 'active_users':
        return users.filter(is_active=True)
    if audience_filter == 'inactive_users':
        return users.filter(is_active=False)

    free_trial_user_ids = set(
        SMSMessage.objects.filter(send_mode='free_trial').values_list('sender_id', flat=True)
    ) | set(
        FreeTrialVerifiedNumber.objects.filter(is_verified=True).values_list('owner_id', flat=True)
    )

    if audience_filter == 'free_trial_users':
        return users.filter(id__in=free_trial_user_ids)

    if audience_filter == 'non_free_trial_users':
        return users.exclude(id__in=free_trial_user_ids)

    return users


def _get_user_sms_usage_summary(user):
    if _has_primary_admin_access(user):
        total_limit = 1000
        used_messages = (
            SMSMessage.objects.filter(sender=user)
            .exclude(status='failed')
            .exclude(Q(batch_reference__startswith='free-trial') & Q(recipient_user__isnull=False))
            .count()
        )
        wallet_balance = max(0, total_limit - used_messages)
    else:
        total_limit = FREE_TRIAL_MESSAGE_LIMIT
        used_messages = SMSMessage.objects.filter(
            send_mode='free_trial',
            status__in=['sent', 'delivered'],
        ).filter(
            Q(sender=user) | Q(recipient_user=user),
        ).count()
        wallet_balance = max(0, total_limit - used_messages)

    available_messages = max(0, total_limit - used_messages)
    used_percentage = round((used_messages / total_limit) * 100, 2) if total_limit > 0 else 0
    available_percentage = round((available_messages / total_limit) * 100, 2) if total_limit > 0 else 0

    return {
        'total_limit': total_limit,
        'used_messages': used_messages,
        'available_messages': available_messages,
        'used_percentage': used_percentage,
        'available_percentage': available_percentage,
        'wallet_balance': wallet_balance,
    }

class SignupView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        first_name = (request.data.get('first_name') or '').strip()
        email = (request.data.get('email') or '').strip().lower()
        phone_number = (request.data.get('phone_number') or '').strip()
        password = request.data.get('password') or ''

        if not first_name or not email or not phone_number or not password:
            return Response({'detail': 'name, email, phone_number and password are required'}, status=400)

        try:
            validate_password(password)
        except ValidationError as error:
            return Response({'password': list(error.messages)}, status=400)

        existing_user = _find_user_by_email(email)
        if existing_user and existing_user.is_active:
            return Response({'detail': 'User already exists with this email address.'}, status=400)

        if existing_user and not existing_user.is_active:
            existing_user.first_name = first_name
            existing_user.phone_number = phone_number
            existing_user.username = email
            existing_user.email = email
            existing_user.set_password(password)

            otp = generate_otp()
            existing_user.otp_code = otp
            existing_user.otp_created = timezone.now()
            existing_user.save()

            email_sent = send_otp_via_email(existing_user, otp)
            diagnostics = _otp_email_diagnostics(email_sent)
            return Response(
                {
                    'requires_otp': True,
                    'email_sent': email_sent,
                    'detail': 'Account exists but is not verified. A new OTP has been generated and sent.',
                    **diagnostics,
                },
                status=200,
                headers={'X-OTP-Email-Sent': 'true' if email_sent else 'false'},
            )

        serializer = self.get_serializer(data={
            'first_name': first_name,
            'username': email,
            'email': email,
            'phone_number': phone_number,
            'password': password,
        })
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        otp = generate_otp()
        user.otp_code = otp
        user.otp_created = timezone.now()

        admin_auto_login = _is_primary_admin_email(user.email)
        if admin_auto_login:
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.is_sms_enabled = True

        user.save()

        email_sent = send_otp_via_email(user, otp)
        diagnostics = _otp_email_diagnostics(email_sent)

        if admin_auto_login:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'requires_otp': False,
                'detail': 'Admin account is active and fully privileged.'
            }, status=201)

        return Response({
            'requires_otp': True,
            'email_sent': email_sent,
            'detail': 'OTP generated. If email is not received, check SMTP credentials/server logs.',
            **diagnostics,
        }, status=201, headers={'X-OTP-Email-Sent': 'true' if email_sent else 'false'})

class OTPVerifyView(generics.GenericAPIView):
    serializer_class = OTPVerifySerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        otp = serializer.validated_data['otp']
        user = _find_user_by_email(email)
        if not user:
            return Response({'detail': 'Invalid email'}, status=400)
        if not otp_is_valid(user, otp):
            return Response({'detail': 'Invalid or expired OTP'}, status=400)
        user.is_active = True
        user.otp_code = ''
        user.save()
        # return JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        })

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']
        user = _find_user_by_email(email)
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=401)

        _promote_primary_admin(user)

        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials'}, status=401)

        if not user.is_active:
            return Response(
                {
                    'detail': 'Account not verified. Please verify OTP.',
                    'requires_otp_verification': True,
                    'email': user.email,
                },
                status=403,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'is_admin': _has_primary_admin_access(user),
            'is_primary_admin': _has_primary_admin_access(user),
        })

class ForgotPasswordView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = _find_user_by_email(serializer.validated_data['email'])
        if not user:
            return Response(status=status.HTTP_204_NO_CONTENT)
        _promote_primary_admin(user)

        otp = generate_otp()
        user.otp_code = otp
        user.otp_created = timezone.now()
        user.save()
        email_sent = send_otp_via_email(user, otp)
        diagnostics = _otp_email_diagnostics(email_sent)
        headers = {'X-OTP-Email-Sent': 'true' if email_sent else 'false'}
        if not email_sent:
            return Response(
                {
                    'detail': 'OTP generated. Email sending failed; verify server EMAIL_* configuration and mail provider logs.',
                    'email_sent': False,
                    **diagnostics,
                },
                status=200,
                headers=headers,
            )
        return Response(
            {
                'detail': 'OTP sent successfully.',
                'email_sent': True,
                **diagnostics,
            },
            status=200,
            headers=headers,
        )


class ResendOTPView(generics.GenericAPIView):
    serializer_class = ForgotPasswordSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = _find_user_by_email(serializer.validated_data['email'])
        if not user:
            return Response(status=status.HTTP_204_NO_CONTENT)

        otp = generate_otp()
        user.otp_code = otp
        user.otp_created = timezone.now()
        user.save(update_fields=['otp_code', 'otp_created'])
        email_sent = send_otp_via_email(user, otp)
        diagnostics = _otp_email_diagnostics(email_sent)
        headers = {'X-OTP-Email-Sent': 'true' if email_sent else 'false'}

        return Response(
            {
                'detail': 'OTP sent successfully.' if email_sent else 'OTP generated but email sending failed.',
                'email_sent': email_sent,
                **diagnostics,
            },
            status=200,
            headers=headers,
        )

class ResetPasswordView(generics.GenericAPIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = _find_user_by_email(serializer.validated_data['email'])
        if not user:
            return Response({'detail': 'Invalid email'}, status=400)
        if not otp_is_valid(user, serializer.validated_data['otp']):
            return Response({'detail': 'Invalid or expired OTP'}, status=400)
        user.set_password(serializer.validated_data['new_password'])
        user.otp_code = ''
        user.is_active = True  # Activate user after successful password reset
        user.save()
        return Response(status=status.HTTP_200_OK)


class UserProfileView(generics.GenericAPIView):
    """Get authenticated user's profile"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        usage_summary = _get_user_sms_usage_summary(user)
        verified_numbers_count = FreeTrialVerifiedNumber.objects.filter(owner=user, is_verified=True).count()
        provider_config = _get_admin_managed_sms_provider_config() or {}
        resolved_free_trial_sender_id = ''
        if provider_config:
            try:
                resolved_free_trial_sender_id = _resolve_free_trial_sender_id(user, provider_config)
            except ValueError:
                resolved_free_trial_sender_id = ''
        data = {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'email': user.email,
            'phone_number': user.phone_number,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_primary_admin': _has_primary_admin_access(user),
            'is_sms_enabled': user.is_sms_enabled,
            'sender_id_type': user.sender_id_type,
            'sender_id': user.sender_id,
            'free_trial_sender_id': user.free_trial_sender_id,
            'date_joined': user.date_joined,
            'last_login': user.last_login,
            'sms_total_limit': usage_summary['total_limit'],
            'sms_used_messages': usage_summary['used_messages'],
            'sms_available_messages': usage_summary['available_messages'],
            'sms_used_percentage': usage_summary['used_percentage'],
            'sms_available_percentage': usage_summary['available_percentage'],
            'wallet_balance': usage_summary['wallet_balance'],
            'free_trial_limit': FREE_TRIAL_MESSAGE_LIMIT,
            'free_trial_verified_numbers_count': verified_numbers_count,
            'free_trial_service_sender_id': resolved_free_trial_sender_id,
        }
        return Response(data)

    def patch(self, request):
        user = request.user
        first_name = request.data.get('first_name', user.first_name)
        last_name = request.data.get('last_name', user.last_name)
        phone_number = request.data.get('phone_number', user.phone_number)
        incoming_type = request.data.get('sender_id_type', user.sender_id_type)
        incoming_sender_id = request.data.get('sender_id', user.sender_id or '')

        first_name = (first_name or '').strip()
        last_name = (last_name or '').strip()
        if not first_name:
            return Response({'detail': 'First name is required'}, status=status.HTTP_400_BAD_REQUEST)

        raw_phone = str(phone_number or '').strip()
        normalized_phone = _normalize_phone_number(raw_phone)
        if raw_phone and not normalized_phone:
            return Response({'detail': 'Phone number must contain at least 10 digits'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            normalized_type, normalized_sender_id = _normalize_sender_id(incoming_type, incoming_sender_id)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if normalized_sender_id and _sender_id_exists(normalized_sender_id, exclude_user_id=user.id):
            suggestions = _build_sender_id_suggestions(
                normalized_sender_id,
                normalized_type,
                exclude_user_id=user.id,
            )
            return Response(
                {
                    'detail': 'This sender ID is already used by another user.',
                    'suggestions': suggestions,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.first_name = first_name
        user.last_name = last_name
        user.phone_number = normalized_phone if raw_phone else None
        user.sender_id_type = normalized_type
        user.sender_id = normalized_sender_id or None

        try:
            user.save(update_fields=['first_name', 'last_name', 'phone_number', 'sender_id_type', 'sender_id'])
        except IntegrityError:
            suggestions = _build_sender_id_suggestions(
                normalized_sender_id,
                normalized_type,
                exclude_user_id=user.id,
            )
            return Response(
                {
                    'detail': 'This sender ID is already used by another user.',
                    'suggestions': suggestions,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return self.get(request)


class AdminUsersListView(generics.ListAPIView):
    """List all users - admin only"""
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        guard = _primary_admin_guard(request)
        if guard:
            return guard
        
        users = User.objects.all().values(
            'id', 'first_name', 'last_name', 'username', 'email', 'phone_number',
            'is_active', 'is_staff', 'is_superuser', 'is_sms_enabled',
            'sender_id_type', 'sender_id', 'free_trial_sender_id', 'date_joined', 'last_login'
        )
        return Response(list(users))


class AdminUserPermissionView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, user_id):
        guard = _primary_admin_guard(request)
        if guard:
            return guard

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=404)

        if 'first_name' in request.data:
            user.first_name = str(request.data.get('first_name') or '').strip()

        if 'last_name' in request.data:
            user.last_name = str(request.data.get('last_name') or '').strip()

        if 'phone_number' in request.data:
            raw_phone = str(request.data.get('phone_number') or '').strip()
            normalized_phone = _normalize_phone_number(raw_phone)
            if raw_phone and not normalized_phone:
                return Response({'detail': 'Phone number must contain at least 10 digits'}, status=status.HTTP_400_BAD_REQUEST)
            user.phone_number = normalized_phone if raw_phone else None

        for field in ['is_staff', 'is_superuser', 'is_active', 'is_sms_enabled']:
            if field in request.data:
                setattr(user, field, bool(request.data[field]))

        if 'sender_id_type' in request.data or 'sender_id' in request.data:
            incoming_type = request.data.get('sender_id_type', user.sender_id_type)
            incoming_sender_id = request.data.get('sender_id', user.sender_id or '')

            try:
                normalized_type, normalized_sender_id = _normalize_sender_id(incoming_type, incoming_sender_id)
            except ValueError as exc:
                return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            if normalized_sender_id and _sender_id_exists(normalized_sender_id, exclude_user_id=user.id):
                suggestions = _build_sender_id_suggestions(
                    normalized_sender_id,
                    normalized_type,
                    exclude_user_id=user.id,
                )
                return Response(
                    {
                        'detail': 'This sender ID is already used by another user.',
                        'suggestions': suggestions,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.sender_id_type = normalized_type
            user.sender_id = normalized_sender_id or None
            if normalized_sender_id and not str(getattr(user, 'free_trial_sender_id', '') or '').strip():
                user.free_trial_sender_id = normalized_sender_id

        if 'free_trial_sender_id' in request.data:
            free_trial_sender_id = str(request.data.get('free_trial_sender_id') or '').strip()
            if free_trial_sender_id:
                provider_config = _get_admin_managed_sms_provider_config()
                if not provider_config:
                    return Response({'detail': 'Admin SMS credentials not configured'}, status=status.HTTP_400_BAD_REQUEST)

                allowed_sender_ids = [
                    str(item).strip()
                    for item in (provider_config.get('sender_ids') or [])
                    if str(item).strip()
                ]
                if free_trial_sender_id not in allowed_sender_ids:
                    return Response(
                        {'detail': 'Selected free trial sender ID is not available in admin credentials'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                user.free_trial_sender_id = free_trial_sender_id
            else:
                user.free_trial_sender_id = None

        try:
            user.save()
        except IntegrityError:
            suggestions = _build_sender_id_suggestions(
                request.data.get('sender_id', user.sender_id or ''),
                request.data.get('sender_id_type', user.sender_id_type),
                exclude_user_id=user.id,
            )
            return Response(
                {
                    'detail': 'This sender ID is already used by another user.',
                    'suggestions': suggestions,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone_number': user.phone_number,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
            'is_sms_enabled': user.is_sms_enabled,
            'sender_id_type': user.sender_id_type,
            'sender_id': user.sender_id,
            'free_trial_sender_id': user.free_trial_sender_id,
        }, status=200)

    def delete(self, request, user_id):
        guard = _primary_admin_guard(request)
        if guard:
            return guard

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=404)

        if user.id == request.user.id:
            return Response({'detail': 'You cannot delete your own account'}, status=400)

        if _is_primary_admin_email(user.email or ''):
            return Response({'detail': 'Primary admin account cannot be deleted'}, status=400)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SMSSendView(generics.CreateAPIView):
    serializer_class = SMSSendSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        guard = _primary_admin_guard(request)
        if guard:
            return guard

        self._process_due_scheduled_messages()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        transport = validated_data.get('transport') or 'api'
        display_sender_id = validated_data['display_sender_id']
        sms_type = validated_data['sms_type']
        message_content = validated_data['message_content']
        send_mode = validated_data.get('send_mode') or 'single'
        delivery_mode = validated_data.get('delivery_mode') or 'instant'

        schedule_at = None
        timezone_name = ''
        if delivery_mode == 'scheduled':
            try:
                schedule_at, timezone_name = self._build_schedule_datetime(validated_data)
            except ValueError as exc:
                return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        provider_config = None
        dispatch_config = {'transport': transport}
        if transport == 'api':
            provider_config = _get_sms_provider_config()
            if not provider_config:
                return Response({'detail': 'SMS credentials not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            dispatch_config.update(provider_config)
        else:
            dispatch_config.update(self._build_smpp_config(validated_data))

        if send_mode == 'single':
            recipient_user_id = validated_data.get('recipient_user_id')
            recipient_number = _normalize_phone_number(validated_data.get('recipient_number'))
            if not recipient_number:
                return Response({'detail': 'Invalid phone number'}, status=status.HTTP_400_BAD_REQUEST)

            recipient_user = None
            try:
                if recipient_user_id:
                    recipient_user = User.objects.get(id=recipient_user_id)
                    if not recipient_user.is_sms_enabled:
                        return Response({'detail': 'Recipient user has SMS disabled'}, status=status.HTTP_400_BAD_REQUEST)
            except (TypeError, ValueError, User.DoesNotExist):
                recipient_user = None

            sms_msg = self._create_sms_record(
                request=request,
                recipient_number=recipient_number,
                recipient_user=recipient_user,
                display_sender_id=display_sender_id,
                message_content=message_content,
                sms_type=sms_type,
                send_mode=send_mode,
                schedule_at=schedule_at,
                timezone_name=timezone_name,
                batch_reference='',
                source_file_name='',
            )

            send_result = self._dispatch_or_schedule_message(sms_msg, dispatch_config)
            if transport == 'api':
                self._persist_sender_id(provider_config, display_sender_id)

            response_payload = SMSMessageSerializer(sms_msg).data
            response_payload['delivery_action'] = send_result
            response_payload['transport'] = transport
            if send_result == 'scheduled':
                return Response(response_payload, status=status.HTTP_202_ACCEPTED)
            return Response(response_payload, status=status.HTTP_201_CREATED)

        source_file = validated_data.get('source_file')
        source_file_name = (source_file.name if source_file else '')
        batch_reference = uuid.uuid4().hex[:16]

        targets = []
        skipped_rows = 0
        if send_mode == 'file_numbers':
            try:
                recipient_numbers = self._extract_numbers_from_uploaded_file(source_file)
            except ValueError as exc:
                return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            targets = [{'recipient_number': number, 'message_content': message_content} for number in recipient_numbers]

        elif send_mode == 'personalized_file':
            try:
                rows = self._extract_rows_from_excel(source_file)
            except ValueError as exc:
                return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            for row_values in rows:
                recipient_number = _extract_phone_from_row(row_values)
                if not recipient_number:
                    skipped_rows += 1
                    continue

                rendered_message = _render_personalized_template(message_content, row_values)
                if not rendered_message or len(rendered_message) > 160:
                    skipped_rows += 1
                    continue

                targets.append({'recipient_number': recipient_number, 'message_content': rendered_message})

        elif send_mode == 'group':
            try:
                group = SMSContactGroup.objects.get(id=validated_data.get('group_id'), owner=request.user)
            except SMSContactGroup.DoesNotExist:
                return Response({'detail': 'Selected group not found'}, status=status.HTTP_404_NOT_FOUND)

            contacts = group.contacts.all().values_list('phone_number', flat=True)
            targets = [{'recipient_number': _normalize_phone_number(number), 'message_content': message_content} for number in contacts]
            targets = [item for item in targets if item['recipient_number']]

        if not targets:
            if send_mode == 'personalized_file':
                return Response(
                    {
                        'detail': (
                            'No valid recipients found in uploaded personalized file. '
                            'Check that at least one column contains 10+ digit phone numbers '
                            'and rendered message length stays within 160 characters.'
                        ),
                        'skipped_rows': skipped_rows,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response({'detail': 'No valid recipients found for selected mode'}, status=status.HTTP_400_BAD_REQUEST)

        sent_count = 0
        failed_count = 0
        scheduled_count = 0
        message_ids = []
        failure_reason_counts = {}
        failed_examples = []

        for target in targets:
            sms_msg = self._create_sms_record(
                request=request,
                recipient_number=target['recipient_number'],
                recipient_user=None,
                display_sender_id=display_sender_id,
                message_content=target['message_content'],
                sms_type=sms_type,
                send_mode=send_mode,
                schedule_at=schedule_at,
                timezone_name=timezone_name,
                batch_reference=batch_reference,
                source_file_name=source_file_name,
            )

            result = self._dispatch_or_schedule_message(sms_msg, dispatch_config)
            if result == 'scheduled':
                scheduled_count += 1
            elif result == 'sent':
                sent_count += 1
            else:
                failed_count += 1
                failure_reason = (sms_msg.failure_reason or 'Unknown failure').strip() or 'Unknown failure'
                failure_reason_counts[failure_reason] = failure_reason_counts.get(failure_reason, 0) + 1
                if len(failed_examples) < 20:
                    failed_examples.append({
                        'recipient_number': sms_msg.recipient_number,
                        'reason': failure_reason,
                    })

            if sms_msg.message_id:
                message_ids.append(sms_msg.message_id)

        if transport == 'api':
            self._persist_sender_id(provider_config, display_sender_id)

        return Response(
            {
                'detail': 'Bulk SMS processing complete',
                'transport': transport,
                'send_mode': send_mode,
                'batch_reference': batch_reference,
                'total_targets': len(targets),
                'sent_count': sent_count,
                'scheduled_count': scheduled_count,
                'failed_count': failed_count,
                'skipped_rows': skipped_rows,
                'message_ids': message_ids[:50],
                'failure_summary': [
                    {'reason': reason, 'count': count}
                    for reason, count in sorted(failure_reason_counts.items(), key=lambda item: item[1], reverse=True)
                ],
                'failed_examples': failed_examples,
            },
            status=status.HTTP_201_CREATED,
        )

    def _build_smpp_config(self, validated_data):
        return {
            'host': str(validated_data.get('smpp_host') or '').strip(),
            'port': int(validated_data.get('smpp_port') or 2775),
            'system_id': str(validated_data.get('smpp_system_id') or '').strip(),
            'password': str(validated_data.get('smpp_password') or '').strip(),
            'profile': str(validated_data.get('smpp_profile') or 'standard').strip(),
            'template_id': str(validated_data.get('smpp_template_id') or '').strip(),
            'source_addr_ton': int(validated_data.get('smpp_source_addr_ton') or 5),
            'source_addr_npi': int(validated_data.get('smpp_source_addr_npi') or 0),
            'dest_addr_ton': int(validated_data.get('smpp_dest_addr_ton') or 1),
            'dest_addr_npi': int(validated_data.get('smpp_dest_addr_npi') or 1),
            'data_coding': int(validated_data.get('smpp_data_coding') or 0),
            'registered_delivery': bool(validated_data.get('smpp_registered_delivery', True)),
        }

    def _create_sms_record(
        self,
        request,
        recipient_number,
        recipient_user,
        display_sender_id,
        message_content,
        sms_type,
        send_mode,
        schedule_at,
        timezone_name,
        batch_reference,
        source_file_name,
    ):
        return SMSMessage.objects.create(
            sender=request.user,
            recipient_number=recipient_number,
            recipient_user=recipient_user,
            display_sender_id=display_sender_id,
            message_content=message_content,
            sms_type=sms_type,
            send_mode=send_mode,
            schedule_type='scheduled' if schedule_at else 'instant',
            scheduled_at=schedule_at,
            timezone_name=timezone_name,
            batch_reference=batch_reference,
            source_file_name=source_file_name,
            status='pending',
        )

    def _dispatch_or_schedule_message(self, sms_msg, provider_config):
        if sms_msg.scheduled_at and sms_msg.scheduled_at > timezone.now():
            return 'scheduled'

        try:
            if provider_config.get('transport') == 'smpp':
                api_result = self._send_sms_via_smpp(
                    provider_config,
                    sms_msg.display_sender_id,
                    sms_msg.recipient_number,
                    sms_msg.message_content,
                )
            else:
                api_result = self._send_sms_via_api(
                    provider_config['user'],
                    provider_config['password'],
                    sms_msg.display_sender_id,
                    sms_msg.recipient_number,
                    sms_msg.message_content,
                )
            sms_msg.message_id = api_result.get('message_id')
            sms_msg.status = api_result.get('status', 'sent')
            sms_msg.delivery_time = timezone.now() if sms_msg.status in ['sent', 'delivered'] else None
            sms_msg.failure_reason = ''
            sms_msg.save(update_fields=['message_id', 'status', 'delivery_time', 'failure_reason', 'updated_at'])
            return 'sent'
        except Exception as exc:
            sms_msg.status = 'failed'
            sms_msg.failure_reason = str(exc)
            sms_msg.save(update_fields=['status', 'failure_reason', 'updated_at'])
            return 'failed'

    def _build_schedule_datetime(self, validated_data):
        timezone_name = (validated_data.get('timezone_name') or '').strip()
        start_date = validated_data.get('start_date')
        start_time = validated_data.get('start_time')

        try:
            selected_zone = ZoneInfo(timezone_name)
        except Exception:
            raise ValueError('Invalid timezone selected')

        combined = datetime.combine(start_date, start_time)
        localized = combined.replace(tzinfo=selected_zone)
        scheduled_utc = localized.astimezone(dt_timezone.utc)

        if scheduled_utc <= timezone.now():
            raise ValueError('Scheduled date/time must be in the future')

        return scheduled_utc, timezone_name

    def _extract_numbers_from_uploaded_file(self, source_file):
        if not source_file:
            raise ValueError('No file uploaded')

        filename = (source_file.name or '').lower()
        normalized_numbers = []
        seen = set()

        def _append_number(raw_value):
            normalized = _normalize_phone_number(raw_value)
            if normalized and normalized not in seen:
                seen.add(normalized)
                normalized_numbers.append(normalized)

        def _consume_text_line(text_line):
            text_line = str(text_line or '').strip()
            if not text_line:
                return

            for token in re.split(r'[\s,;|]+', text_line):
                _append_number(token)

            _append_number(text_line)

        if filename.endswith('.txt'):
            source_file.seek(0)
            raw_text = source_file.read().decode('utf-8', errors='ignore')
            for line in raw_text.splitlines():
                _consume_text_line(line)

            if not normalized_numbers:
                raise ValueError(
                    'No valid phone numbers found in TXT file. '
                    'Add one number per line or comma-separated numbers (minimum 10 digits each).'
                )
            return normalized_numbers

        if filename.endswith('.xls'):
            try:
                import xlrd
            except ImportError:
                raise ValueError('XLS upload requires xlrd package on server. Install xlrd or upload .xlsx/.txt file.')

            try:
                source_file.seek(0)
                workbook = xlrd.open_workbook(file_contents=source_file.read())
                for sheet in workbook.sheets():
                    for row_index in range(sheet.nrows):
                        for col_index in range(sheet.ncols):
                            _append_number(sheet.cell_value(row_index, col_index))
            except Exception as exc:
                raise ValueError(f'Unable to read XLS file: {exc}')

            if not normalized_numbers:
                raise ValueError(
                    'No valid phone numbers found in XLS file. '
                    'Ensure sheet contains mobile numbers with at least 10 digits.'
                )
            return normalized_numbers

        try:
            import openpyxl
            source_file.seek(0)
            workbook = openpyxl.load_workbook(source_file, read_only=True, data_only=True)
            worksheet = workbook.active
            for row in worksheet.iter_rows(values_only=True):
                for cell in row:
                    _append_number(cell)

            workbook.close()

            if not normalized_numbers:
                raise ValueError(
                    'No valid phone numbers found in Excel file. '
                    'Ensure at least one column contains mobile numbers with minimum 10 digits.'
                )
            return normalized_numbers
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(f'Unable to read uploaded file: {exc}')

    def _extract_rows_from_excel(self, source_file):
        if not source_file:
            raise ValueError('No file uploaded')

        filename = (source_file.name or '').lower()
        rows = []

        if filename.endswith('.xls'):
            try:
                import xlrd
            except ImportError:
                raise ValueError('XLS upload requires xlrd package on server. Install xlrd or upload .xlsx file.')

            try:
                source_file.seek(0)
                workbook = xlrd.open_workbook(file_contents=source_file.read())
                for sheet in workbook.sheets():
                    for row_index in range(sheet.nrows):
                        values = [sheet.cell_value(row_index, col_index) for col_index in range(sheet.ncols)]
                        if any(str(value).strip() for value in values):
                            rows.append(values)
            except Exception as exc:
                raise ValueError(f'Unable to read XLS file: {exc}')

            if not rows:
                raise ValueError('Uploaded XLS file is empty or has no readable rows.')
            return rows

        try:
            import openpyxl
            source_file.seek(0)
            workbook = openpyxl.load_workbook(source_file, read_only=True, data_only=True)
            worksheet = workbook.active
            for row in worksheet.iter_rows(values_only=True):
                values = [item if item is not None else '' for item in row]
                if any(str(value).strip() for value in values):
                    rows.append(values)

            workbook.close()
        except Exception as exc:
            raise ValueError(f'Unable to read Excel file: {exc}')

        if not rows:
            raise ValueError('Uploaded Excel file is empty or has no readable rows.')
        return rows

    def _persist_sender_id(self, provider_config, display_sender_id):
        normalized_sender = (display_sender_id or '').strip()
        if not normalized_sender:
            return

        cred = provider_config.get('credential')
        if cred:
            existing_sender_ids = [str(item).strip() for item in (cred.sender_ids or []) if str(item).strip()]
            if normalized_sender not in existing_sender_ids:
                cred.sender_ids = [*existing_sender_ids, normalized_sender]
                cred.save(update_fields=['sender_ids', 'updated_at'])
            return

        seeded_sender_ids = provider_config.get('sender_ids', [])
        combined_sender_ids = [*seeded_sender_ids]
        if normalized_sender not in combined_sender_ids:
            combined_sender_ids.append(normalized_sender)
        SMSCredential.objects.create(
            user=provider_config['user'],
            password=provider_config['password'],
            sender_ids=combined_sender_ids,
            is_active=True,
        )

    def _process_due_scheduled_messages(self):
        provider_config = _get_sms_provider_config()
        if not provider_config:
            return

        due_messages = SMSMessage.objects.filter(
            status='pending',
            schedule_type='scheduled',
            scheduled_at__isnull=False,
            scheduled_at__lte=timezone.now(),
        ).order_by('scheduled_at')[:100]

        for sms_msg in due_messages:
            self._dispatch_or_schedule_message(sms_msg, provider_config)

    def _send_sms_via_api(self, user, password, sender_id, number, message):
        primary_url = getattr(settings, 'SMS_PROVIDER_URL', 'https://mshastra.com/bsms/buser/send_sms_center.aspx')
        json_fallback_url = getattr(settings, 'SMS_PROVIDER_JSON_URL', 'https://mshastra.com/sendsms_api_json.aspx')
        normalized_number = _normalize_phone_number(number)
        candidate_numbers = []
        if normalized_number:
            candidate_numbers.append(normalized_number)
            if len(normalized_number) == 10:
                candidate_numbers.append(f'91{normalized_number}')
            elif len(normalized_number) == 11 and normalized_number.startswith('0'):
                candidate_numbers.append(f'91{normalized_number[1:]}')
        else:
            raw_number = str(number or '').strip()
            if raw_number:
                candidate_numbers.append(raw_number)

        candidate_numbers = list(dict.fromkeys([item for item in candidate_numbers if item]))
        payload_variants = []
        for candidate_number in candidate_numbers:
            payload_item = {
                "user": user,
                "pwd": password,
                "number": candidate_number,
                "msg": message,
                "sender": sender_id,
                "language": "English"
            }
            payload_variants.append(payload_item)
            payload_variants.append([payload_item])

        if not payload_variants:
            raise Exception('Invalid recipient number')
        headers = {"Content-Type": "application/json"}

        def _post_with_retry(url, payload, max_attempts=3):
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    response = requests.post(url, json=payload, headers=headers, timeout=20)
                    if response.status_code >= 500 and attempt < max_attempts:
                        time.sleep(1.2)
                        continue
                    return response
                except requests.RequestException as exc:
                    last_exception = exc
                    if attempt < max_attempts:
                        time.sleep(1.2)
                        continue
                    raise Exception(f"SMS transport error: {type(exc).__name__}")
            if last_exception:
                raise Exception(f"SMS transport error: {type(last_exception).__name__}")
            raise Exception("SMS transport error")

        def _parse_response(resp):
            if resp.status_code != 200:
                error_text = (resp.text or '').strip().replace('\n', ' ')[:260]
                raise Exception(f"SMS API error {resp.status_code}: {error_text or 'No response body'}")

            try:
                result = resp.json()
            except ValueError:
                text = (resp.text or '').strip()
                lowered = text.lower()

                if not text:
                    raise Exception('Empty SMS provider response')

                if 'session time out' in lowered or 'login again' in lowered:
                    return {'retry_with_json_endpoint': True}

                if any(keyword in lowered for keyword in ['error', 'failed', 'invalid', 'unauthorized']):
                    raise Exception(f'SMS provider failure response: {text[:220]}')

                success_indicators = ['success', 'submitted', 'accepted', 'queued', 'sent']
                if any(keyword in lowered for keyword in success_indicators):
                    message_id_match = re.search(r'(msgid|message[_\s-]?id|id)\s*[:=]\s*([A-Za-z0-9_-]+)', text, flags=re.IGNORECASE)
                    message_id = message_id_match.group(2) if message_id_match else None
                    return {
                        'message_id': message_id or f'text-{timezone.now().timestamp()}',
                        'status': 'sent'
                    }

                raise Exception('SMS provider returned ambiguous response')

            if isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict):
                item = result[0]
                msg_id = item.get('MsgId') or item.get('msgid') or item.get('id') or item.get('message_id')
                status_text = str(item.get('Status') or item.get('status') or '').lower()
                if any(keyword in status_text for keyword in ['fail', 'invalid', 'error']):
                    provider_reason = item.get('Reason') or item.get('reason') or item.get('Message') or item.get('message')
                    if provider_reason:
                        raise Exception(f'SMS provider failure status: {provider_reason}')
                    raise Exception(f'SMS provider returned failure status: {status_text or "failed"}')
                status_value = 'delivered' if 'deliver' in status_text else 'sent'
                return {'message_id': str(msg_id) if msg_id else f'api-{timezone.now().timestamp()}', 'status': status_value}

            if isinstance(result, dict):
                msg_id = result.get('MsgId') or result.get('msgid') or result.get('id') or result.get('message_id')
                status_text = str(result.get('Status') or result.get('status') or '').lower()
                if any(keyword in status_text for keyword in ['fail', 'invalid', 'error']):
                    provider_reason = result.get('Reason') or result.get('reason') or result.get('Message') or result.get('message')
                    if provider_reason:
                        raise Exception(f'SMS provider failure status: {provider_reason}')
                    raise Exception(f'SMS provider returned failure status: {status_text or "failed"}')
                status_value = 'delivered' if 'deliver' in status_text else 'sent'
                return {'message_id': str(msg_id) if msg_id else f'api-{timezone.now().timestamp()}', 'status': status_value}

            raise Exception('Unexpected SMS provider response format')

        def _send_and_parse(url):
            last_error = None
            for payload_variant in payload_variants:
                try:
                    resp = _post_with_retry(url, payload_variant)
                    return _parse_response(resp)
                except Exception as exc:
                    last_error = exc
            if last_error:
                raise last_error
            raise Exception('SMS provider call failed')

        parsed_primary = _send_and_parse(primary_url)

        if parsed_primary.get('retry_with_json_endpoint'):
            parsed_fallback = _send_and_parse(json_fallback_url)
            if parsed_fallback.get('retry_with_json_endpoint'):
                raise Exception('SMS provider endpoint requires interactive login')
            return parsed_fallback

        return parsed_primary

    def _send_sms_via_smpp(self, smpp_config, sender_id, number, message):
        try:
            import smpplib.client
        except ImportError as exc:
            raise Exception('SMPP support is not installed on the server') from exc

        normalized_number = _normalize_phone_number(number)
        if not normalized_number:
            raise Exception('Invalid recipient number')

        client = smpplib.client.Client(smpp_config['host'], smpp_config['port'])
        client.socket_timeout = 20

        try:
            client.connect()
            client.bind_transceiver(
                system_id=smpp_config['system_id'],
                password=smpp_config['password'],
            )

            send_kwargs = {
                'source_addr_ton': smpp_config['source_addr_ton'],
                'source_addr_npi': smpp_config['source_addr_npi'],
                'source_addr': sender_id,
                'dest_addr_ton': smpp_config['dest_addr_ton'],
                'dest_addr_npi': smpp_config['dest_addr_npi'],
                'destination_addr': normalized_number,
                'short_message': str(message or '').encode('utf-8'),
                'data_coding': smpp_config['data_coding'],
                'registered_delivery': smpp_config['registered_delivery'],
            }

            template_id = str(smpp_config.get('template_id') or '').strip()
            if template_id:
                send_kwargs['optional_parameters'] = {
                    'template_id': template_id,
                }

            pdu = client.send_message(**send_kwargs)
            message_id = getattr(pdu, 'message_id', None) or getattr(pdu, 'sequence', None)

            return {
                'message_id': str(message_id) if message_id is not None else f'smpp-{timezone.now().timestamp()}',
                'status': 'sent',
            }
        except (socket.timeout, OSError) as exc:
            raise Exception(f'SMPP transport error: {type(exc).__name__}') from exc
        except Exception as exc:
            raise Exception(str(exc)) from exc
        finally:
            try:
                client.unbind()
            except Exception:
                pass
            try:
                client.disconnect()
            except Exception:
                pass


class SMSTimezoneListView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = (request.query_params.get('q') or '').strip().lower()
        now_utc = datetime.now(dt_timezone.utc)
        rows = []

        try:
            import pytz

            for country_code, zone_list in sorted(pytz.country_timezones.items(), key=lambda item: pytz.country_names.get(item[0], item[0])):
                country_name = pytz.country_names.get(country_code, country_code)

                if query and query not in country_name.lower() and not any(query in zone.lower() for zone in zone_list):
                    continue

                for timezone_name in zone_list:
                    try:
                        zone = ZoneInfo(timezone_name)
                        localized_now = now_utc.astimezone(zone)
                        offset_label, offset_compact, offset_minutes = _format_utc_offset(localized_now.utcoffset())
                    except Exception:
                        offset_label, offset_compact, offset_minutes = 'UTC+00:00', '+0.00', 0

                    city_label = timezone_name.split('/')[-1].replace('_', ' ')
                    rows.append(
                        {
                            'country_code': country_code,
                            'country_name': country_name,
                            'timezone_name': timezone_name,
                            'city_label': city_label,
                            'offset_label': offset_label,
                            'offset_compact': offset_compact,
                            'offset_minutes': offset_minutes,
                            'display_label': f'{city_label} ({offset_compact})',
                        }
                    )

            rows.sort(key=lambda item: (item['country_name'], item['offset_minutes'], item['timezone_name']))
            return Response({'count': len(rows), 'results': rows}, status=status.HTTP_200_OK)
        except Exception:
            fallback_zones = sorted(available_timezones())
            for timezone_name in fallback_zones:
                if query and query not in timezone_name.lower():
                    continue

                try:
                    zone = ZoneInfo(timezone_name)
                    localized_now = now_utc.astimezone(zone)
                    offset_label, offset_compact, offset_minutes = _format_utc_offset(localized_now.utcoffset())
                except Exception:
                    offset_label, offset_compact, offset_minutes = 'UTC+00:00', '+0.00', 0

                rows.append(
                    {
                        'country_code': 'ZZ',
                        'country_name': 'Other',
                        'timezone_name': timezone_name,
                        'city_label': timezone_name.replace('_', ' '),
                        'offset_label': offset_label,
                        'offset_compact': offset_compact,
                        'offset_minutes': offset_minutes,
                        'display_label': f'{timezone_name} ({offset_compact})',
                    }
                )

            rows.sort(key=lambda item: (item['offset_minutes'], item['timezone_name']))
            return Response({'count': len(rows), 'results': rows}, status=status.HTTP_200_OK)


class SMSUsageSummaryView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        summary = _get_user_sms_usage_summary(request.user)
        summary['free_trial_limit'] = FREE_TRIAL_MESSAGE_LIMIT
        summary['is_admin'] = _has_primary_admin_access(request.user)
        summary['verified_numbers_count'] = FreeTrialVerifiedNumber.objects.filter(owner=request.user, is_verified=True).count()
        return Response(summary, status=status.HTTP_200_OK)


class FreeTrialVerifiedNumbersView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        numbers = list(
            FreeTrialVerifiedNumber.objects.filter(owner=request.user, is_verified=True)
            .order_by('-verified_at', '-updated_at')
            .values_list('phone_number', flat=True)
        )
        return Response({'verified_numbers': numbers}, status=status.HTTP_200_OK)


class FreeTrialSendOTPView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if _has_primary_admin_access(request.user):
            return Response({'detail': 'Admin users already have full SMS access'}, status=status.HTTP_400_BAD_REQUEST)

        recipient_number = _normalize_phone_number(request.data.get('recipient_number'))
        if not recipient_number:
            return Response({'detail': 'Enter a valid recipient number (minimum 10 digits)'}, status=status.HTTP_400_BAD_REQUEST)

        provider_config = _get_admin_managed_sms_provider_config()
        if not provider_config:
            return Response({'detail': 'Free trial SMS service is temporarily unavailable. Please try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            sender_id = _resolve_free_trial_sender_id(request.user, provider_config)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        mediator_user = _get_free_trial_mediator_user() or request.user

        record, _ = FreeTrialVerifiedNumber.objects.get_or_create(
            owner=request.user,
            phone_number=recipient_number,
        )

        otp_code = generate_otp()
        record.otp_code = otp_code
        record.otp_created = timezone.now()
        record.is_verified = False
        record.verified_at = None
        record.save(update_fields=['otp_code', 'otp_created', 'is_verified', 'verified_at', 'updated_at'])

        otp_message = f'Your ABC free trial OTP is {otp_code}. Valid for {FREE_TRIAL_OTP_EXPIRY_MINUTES} minutes.'
        masked_otp_log_message = 'Free trial OTP sent for verification'

        otp_sms_log = SMSMessage.objects.create(
            sender=mediator_user,
            recipient_number=recipient_number,
            recipient_user=request.user,
            display_sender_id=sender_id,
            message_content=masked_otp_log_message,
            sms_type='transactional',
            send_mode='single',
            schedule_type='instant',
            status='pending',
            batch_reference=f'free-trial-otp-{request.user.id}',
            source_file_name='',
        )

        try:
            send_result = SMSSendView()._send_sms_via_api(
                provider_config['user'],
                provider_config['password'],
                sender_id,
                recipient_number,
                otp_message,
            )
            otp_sms_log.message_id = send_result.get('message_id')
            otp_sms_log.status = send_result.get('status', 'sent')
            otp_sms_log.delivery_time = timezone.now() if otp_sms_log.status in ['sent', 'delivered'] else None
            otp_sms_log.failure_reason = ''
            otp_sms_log.save(update_fields=['message_id', 'status', 'delivery_time', 'failure_reason', 'updated_at'])
        except Exception as exc:
            otp_sms_log.status = 'failed'
            otp_sms_log.failure_reason = str(exc)
            otp_sms_log.save(update_fields=['status', 'failure_reason', 'updated_at'])
            return Response({'detail': 'Unable to send OTP right now. Please retry after some time.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(
            {
                'detail': 'OTP sent successfully',
                'recipient_number': recipient_number,
                'otp_sent': True,
                'provider_message_id': send_result.get('message_id'),
                'delivery_status': send_result.get('status', 'sent'),
            },
            status=status.HTTP_200_OK,
        )


class FreeTrialVerifyOTPView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if request.user.is_authenticated and _has_primary_admin_access(request.user):
            return Response({'detail': 'Admin users do not require free trial OTP'}, status=status.HTTP_400_BAD_REQUEST)

        recipient_number = _normalize_phone_number(request.data.get('recipient_number'))
        otp_code = str(request.data.get('otp') or '').strip()

        if not recipient_number:
            return Response({'detail': 'Recipient number is required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(otp_code) < 4:
            return Response({'detail': 'Enter a valid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        record = None
        if request.user.is_authenticated:
            try:
                record = FreeTrialVerifiedNumber.objects.get(owner=request.user, phone_number=recipient_number)
            except FreeTrialVerifiedNumber.DoesNotExist:
                record = None
        else:
            # Fallback for clients that accidentally omit Authorization on this endpoint.
            record = (
                FreeTrialVerifiedNumber.objects.filter(phone_number=recipient_number, otp_code=otp_code)
                .order_by('-updated_at', '-id')
                .first()
            )

        if not record:
            return Response({'detail': 'OTP not requested for this number'}, status=status.HTTP_400_BAD_REQUEST)

        if not record.otp_code:
            return Response({'detail': 'OTP expired or already used. Please resend OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        expiry_cutoff = timezone.now() - timedelta(minutes=FREE_TRIAL_OTP_EXPIRY_MINUTES)
        if not record.otp_created or record.otp_created < expiry_cutoff:
            record.otp_code = ''
            record.save(update_fields=['otp_code', 'updated_at'])
            return Response({'detail': 'OTP expired. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if otp_code != record.otp_code:
            return Response({'detail': 'Invalid OTP', 'verified': False}, status=status.HTTP_400_BAD_REQUEST)

        record.is_verified = True
        record.verified_at = timezone.now()
        record.otp_code = ''
        record.save(update_fields=['is_verified', 'verified_at', 'otp_code', 'updated_at'])

        owner_user = record.owner

        verified_numbers = list(
            FreeTrialVerifiedNumber.objects.filter(owner=owner_user, is_verified=True)
            .order_by('-verified_at', '-updated_at')
            .values_list('phone_number', flat=True)
        )
        return Response(
            {
                'detail': 'OTP verified successfully',
                'verified': True,
                'verified_numbers': verified_numbers,
            },
            status=status.HTTP_200_OK,
        )


class FreeTrialSendSMSView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if _has_primary_admin_access(request.user):
            return Response({'detail': 'Admin users should use regular SMS sending'}, status=status.HTTP_400_BAD_REQUEST)

        usage_summary = _get_user_sms_usage_summary(request.user)
        if usage_summary['used_messages'] >= FREE_TRIAL_MESSAGE_LIMIT:
            return Response(
                {
                    'detail': 'You have used all 3 free trial messages. Please upgrade to continue.',
                    'used_messages': usage_summary['used_messages'],
                    'available_messages': usage_summary['available_messages'],
                    'free_trial_complete': True,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipient_number = _normalize_phone_number(request.data.get('recipient_number'))
        if not recipient_number:
            return Response({'detail': 'Recipient number is required'}, status=status.HTTP_400_BAD_REQUEST)

        is_verified = FreeTrialVerifiedNumber.objects.filter(
            owner=request.user,
            phone_number=recipient_number,
            is_verified=True,
        ).exists()
        if not is_verified:
            return Response({'detail': 'Recipient number is not OTP verified for free trial'}, status=status.HTTP_400_BAD_REQUEST)

        message_content = str(request.data.get('message_content') or '').strip()
        if not message_content:
            return Response({'detail': 'Message content is required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(message_content) > 160:
            return Response({'detail': 'SMS content must be 160 characters or less'}, status=status.HTTP_400_BAD_REQUEST)

        provider_config = _get_admin_managed_sms_provider_config()
        if not provider_config:
            return Response({'detail': 'Free trial SMS service is temporarily unavailable. Please try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            display_sender_id = _resolve_free_trial_sender_id(request.user, provider_config)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        mediator_user = _get_free_trial_mediator_user() or request.user

        sms_msg = SMSMessage.objects.create(
            sender=mediator_user,
            recipient_number=recipient_number,
            recipient_user=request.user,
            display_sender_id=display_sender_id,
            message_content=message_content,
            sms_type='transactional',
            send_mode='free_trial',
            schedule_type='instant',
            status='pending',
            batch_reference=f'free-trial-{request.user.id}',
            source_file_name='',
        )

        try:
            api_result = SMSSendView()._send_sms_via_api(
                provider_config['user'],
                provider_config['password'],
                display_sender_id,
                recipient_number,
                message_content,
            )
            sms_msg.message_id = api_result.get('message_id')
            sms_msg.status = api_result.get('status', 'sent')
            sms_msg.delivery_time = timezone.now() if sms_msg.status in ['sent', 'delivered'] else None
            sms_msg.failure_reason = ''
            sms_msg.save(update_fields=['message_id', 'status', 'delivery_time', 'failure_reason', 'updated_at'])
        except Exception as exc:
            sms_msg.status = 'failed'
            sms_msg.failure_reason = str(exc)
            sms_msg.save(update_fields=['status', 'failure_reason', 'updated_at'])
            return Response({'detail': f'Failed to send SMS: {exc}'}, status=status.HTTP_400_BAD_REQUEST)

        updated_summary = _get_user_sms_usage_summary(request.user)
        return Response(
            {
                'detail': 'Free trial SMS sent successfully',
                'display_sender_id': display_sender_id,
                'message_id': sms_msg.message_id,
                'status': sms_msg.status,
                'used_messages': updated_summary['used_messages'],
                'available_messages': updated_summary['available_messages'],
                'free_trial_complete': updated_summary['available_messages'] <= 0,
            },
            status=status.HTTP_201_CREATED,
        )


class SMSMessageListView(generics.ListAPIView):
    serializer_class = SMSMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            SMSSendView()._process_due_scheduled_messages()
        except Exception:
            pass

        user = self.request.user
        if _has_primary_admin_access(user):
            return SMSMessage.objects.all()
        return SMSMessage.objects.filter(Q(sender=user) | Q(recipient_user=user))


class SMSMessageStatusView(generics.RetrieveAPIView):
    queryset = SMSMessage.objects.all()
    serializer_class = SMSMessageStatusSerializer
    permission_classes = [permissions.IsAuthenticated]


class SMSCredentialView(generics.GenericAPIView):
    serializer_class = SMSCredentialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        guard = _primary_admin_guard(request)
        if guard:
            return guard
        cred = SMSCredential.objects.filter(is_active=True).order_by('-updated_at', '-id').first()
        if not cred:
            env_user = getattr(settings, 'SMS_PROVIDER_USER', '').strip()
            env_sender_ids = [str(item).strip() for item in getattr(settings, 'SMS_DEFAULT_SENDER_IDS', []) if str(item).strip()]
            env_free_trial_sender_id = str(getattr(settings, 'SMS_FREE_TRIAL_DEFAULT_SENDER_ID', '') or '').strip()
            has_env_provider = bool(env_user and getattr(settings, 'SMS_PROVIDER_PASSWORD', '').strip())
            return Response({
                'user': env_user,
                'password': '',
                'sender_ids': env_sender_ids,
                'free_trial_default_sender_id': env_free_trial_sender_id,
                'is_active': has_env_provider,
                'created_at': None,
                'updated_at': None,
            })
        return Response(self.get_serializer(cred).data)

    def patch(self, request):
        guard = _primary_admin_guard(request)
        if guard:
            return guard
        cred = SMSCredential.objects.filter(is_active=True).order_by('-updated_at', '-id').first()
        if not cred:
            cred = SMSCredential.objects.create(
                user=request.data.get('user', ''),
                password=request.data.get('password', ''),
                sender_ids=request.data.get('sender_ids', []),
                free_trial_default_sender_id=request.data.get('free_trial_default_sender_id', ''),
                is_active=True,
            )
            SMSCredential.objects.filter(is_active=True).exclude(id=cred.id).update(is_active=False)
            return Response(self.get_serializer(cred).data, status=status.HTTP_201_CREATED)

        serializer = self.get_serializer(cred, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        SMSCredential.objects.filter(is_active=True).exclude(id=cred.id).update(is_active=False)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SMSContactGroupView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        groups = SMSContactGroup.objects.filter(owner=request.user).annotate(member_count=Count('contacts'))
        serializer = SMSContactGroupSerializer(groups, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SMSContactGroupCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        group_name = serializer.validated_data['name'].strip()
        members = serializer.validated_data['members']

        if not group_name:
            return Response({'detail': 'Group name is required'}, status=status.HTTP_400_BAD_REQUEST)

        group, created = SMSContactGroup.objects.get_or_create(owner=request.user, name=group_name)

        added = 0
        for raw_member in members:
            raw_text = str(raw_member or '').strip()
            if not raw_text:
                continue

            member_name = ''
            if ',' in raw_text:
                left, right = raw_text.rsplit(',', 1)
                normalized = _normalize_phone_number(right)
                if normalized:
                    member_name = left.strip()
                    phone_number = normalized
                else:
                    phone_number = _normalize_phone_number(raw_text)
            else:
                phone_number = _normalize_phone_number(raw_text)

            if not phone_number:
                continue

            _, was_created = SMSContact.objects.get_or_create(
                group=group,
                phone_number=phone_number,
                defaults={'name': member_name},
            )
            if was_created:
                added += 1

        refreshed = SMSContactGroup.objects.filter(id=group.id).annotate(member_count=Count('contacts')).first()
        output = SMSContactGroupSerializer(refreshed).data
        output['created'] = created
        output['added_members'] = added
        return Response(output, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class SMSShortURLView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        urls = SMSShortURL.objects.filter(owner=request.user, is_active=True)
        data = []
        for item in urls:
            serialized = SMSShortURLSerializer(item).data
            serialized['short_url'] = request.build_absolute_uri(f'/s/{item.short_code}/')
            data.append(serialized)
        return Response(data)

    def post(self, request):
        serializer = SMSShortURLSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        short_code = ''
        for _ in range(20):
            candidate = _generate_short_code(7)
            if not SMSShortURL.objects.filter(short_code=candidate).exists():
                short_code = candidate
                break

        if not short_code:
            return Response({'detail': 'Could not generate short URL code'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        short_url = SMSShortURL.objects.create(
            owner=request.user,
            link_name=serializer.validated_data['link_name'],
            short_code=short_code,
            redirect_url=serializer.validated_data['redirect_url'],
            is_active=True,
        )

        output = SMSShortURLSerializer(short_url).data
        output['short_url'] = request.build_absolute_uri(f'/s/{short_code}/')
        return Response(output, status=status.HTTP_201_CREATED)


class SMSShortURLDetailView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, url_id):
        short_url = SMSShortURL.objects.filter(id=url_id, owner=request.user, is_active=True).first()
        if not short_url:
            return Response({'detail': 'Short URL not found'}, status=status.HTTP_404_NOT_FOUND)

        short_url.is_active = False
        short_url.save(update_fields=['is_active', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ShortURLRedirectView(View):
    def get(self, request, short_code, *args, **kwargs):
        short_url = SMSShortURL.objects.filter(short_code=short_code, is_active=True).first()
        if not short_url:
            raise Http404('Short URL not found')

        SMSShortURL.objects.filter(id=short_url.id).update(
            total_clicks=F('total_clicks') + 1,
            last_clicked_at=timezone.now(),
        )
        return HttpResponseRedirect(short_url.redirect_url)


class UserSMSEligibilityView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, user_id):
        guard = _primary_admin_guard(request)
        if guard:
            return guard

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if 'is_sms_enabled' in request.data:
            user.is_sms_enabled = bool(request.data.get('is_sms_enabled'))
            user.save()

        return Response(UserSMSEligibilitySerializer(user).data)


class AdminUsersSMSListView(generics.ListAPIView):
    serializer_class = UserSMSEligibilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not _has_primary_admin_access(self.request.user):
            return User.objects.none()
        return User.objects.all().order_by('-date_joined')


class AdminUsersExportView(generics.GenericAPIView):
    """Export all users to Excel - admin only"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        guard = _primary_admin_guard(request)
        if guard:
            return guard
        
        try:
            import openpyxl
            from openpyxl.styles import Font, PatternFill, Alignment
            from django.http import FileResponse
            from io import BytesIO
            
            # Create workbook
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Users"
            
            # Add header row with styling
            headers = ['ID', 'Username', 'Email', 'Phone Number', 'Status', 'Account Type', 'Joined Date']
            header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
            header_font = Font(bold=True, color='FFFFFF')
            
            for col_num, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col_num)
                cell.value = header
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal='center', vertical='center')
            
            # Add user data
            users = User.objects.all()
            for row_num, user in enumerate(users, 2):
                ws.cell(row=row_num, column=1).value = user.id
                ws.cell(row=row_num, column=2).value = user.username
                ws.cell(row=row_num, column=3).value = user.email
                ws.cell(row=row_num, column=4).value = user.phone_number or '-'
                ws.cell(row=row_num, column=5).value = 'Verified' if user.is_active else 'Not Verified'
                ws.cell(row=row_num, column=6).value = 'Admin' if user.is_staff else 'User'
                ws.cell(row=row_num, column=7).value = user.date_joined.strftime('%Y-%m-%d')
                
                # Center align status columns
                for col in [5, 6]:
                    ws.cell(row=row_num, column=col).alignment = Alignment(horizontal='center')
            
            # Adjust column widths
            ws.column_dimensions['A'].width = 8
            ws.column_dimensions['B'].width = 20
            ws.column_dimensions['C'].width = 25
            ws.column_dimensions['D'].width = 15
            ws.column_dimensions['E'].width = 15
            ws.column_dimensions['F'].width = 15
            ws.column_dimensions['G'].width = 15
            
            # Save to BytesIO
            stream = BytesIO()
            wb.save(stream)
            stream.seek(0)
            
            # Return file
            response = FileResponse(
                stream,
                as_attachment=True,
                filename=f'users-export-{timezone.now().strftime("%Y%m%d")}.xlsx'
            )
            response['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            return response
            
        except ImportError:
            return Response(
                {'detail': 'openpyxl package is not installed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'detail': f'Error generating Excel: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminNotificationPreviewView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        guard = _primary_admin_guard(request)
        if guard:
            return guard

        audience_filter = request.query_params.get('audience_filter', 'all_users')
        users = _get_users_for_notification_filter(audience_filter).order_by('-date_joined')
        payload = NotificationRecipientPreviewSerializer(users[:200], many=True).data

        return Response({
            'audience_filter': audience_filter,
            'total_recipients': users.count(),
            'preview_recipients': payload,
        })


class AdminNotificationSendView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AdminNotificationSendSerializer

    def post(self, request):
        guard = _primary_admin_guard(request)
        if guard:
            return guard

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content = serializer.validated_data['content'].strip()
        audience_filter = serializer.validated_data['audience_filter']
        target_users = list(_get_users_for_notification_filter(audience_filter))

        if not target_users:
            return Response({'detail': 'No users found for selected filter'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            notification = InternalNotification.objects.create(
                content=content,
                audience_filter=audience_filter,
                created_by=request.user,
                recipient_count=len(target_users),
            )

            InternalNotificationRecipient.objects.bulk_create([
                InternalNotificationRecipient(notification=notification, user=user)
                for user in target_users
            ])

        return Response(
            {
                'detail': 'Notification sent successfully',
                'notification': AdminNotificationHistorySerializer(notification).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminNotificationHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AdminNotificationHistorySerializer

    def get_queryset(self):
        if not _has_primary_admin_access(self.request.user):
            return InternalNotification.objects.none()
        return InternalNotification.objects.select_related('created_by').all()


class UserNotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserNotificationSerializer

    def get_queryset(self):
        return InternalNotificationRecipient.objects.filter(user=self.request.user).select_related('notification')


class UserNotificationReadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, recipient_id):
        recipient = InternalNotificationRecipient.objects.filter(id=recipient_id, user=request.user).first()
        if not recipient:
            return Response({'detail': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

        if not recipient.is_read:
            recipient.is_read = True
            recipient.read_at = timezone.now()
            recipient.save(update_fields=['is_read', 'read_at'])

        return Response(UserNotificationSerializer(recipient).data)



class ConfirmAdminPromotionView(generics.GenericAPIView):
    """Handle email confirmation link for admin promotion"""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        token = request.query_params.get('token', '').strip()
        user_id = request.query_params.get('user_id')
        promotion_type = request.query_params.get('type', '').strip().lower()  # optional

        if not token or not user_id:
            return Response(
                {'detail': 'Invalid confirmation link', 'success': False},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=int(user_id))
        except (User.DoesNotExist, ValueError):
            return Response(
                {'detail': 'User not found', 'success': False},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if token matches and is not expired (24 hours)
        if user.admin_promotion_token != token:
            return Response(
                {'detail': 'Invalid or expired confirmation token', 'success': False},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.pending_admin_promotion:
            return Response(
                {'detail': 'No pending admin promotion for this user', 'success': False},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.admin_promotion_requested_at:
            expiry_time = user.admin_promotion_requested_at + timedelta(hours=24)
            if timezone.now() > expiry_time:
                user.pending_admin_promotion = False
                user.admin_promotion_token = None
                user.admin_promotion_requested_at = None
                user.save()
                return Response(
                    {'detail': 'Confirmation link has expired (24 hours)', 'success': False},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Infer type from token prefix when not explicitly provided.
        inferred_type = 'staff' if token.startswith('staff::') else 'full_admin'
        resolved_type = promotion_type if promotion_type in ['full_admin', 'staff'] else inferred_type

        # Confirm the promotion
        if resolved_type == 'full_admin':
            user.is_staff = True
            user.is_superuser = True
            promotion_label = 'FULL ADMIN'
        else:
            user.is_staff = True
            user.is_superuser = False
            promotion_label = 'STAFF'

        user.pending_admin_promotion = False
        user.admin_promotion_token = None
        user.admin_promotion_requested_at = None
        user.save()

        return Response(
            {
                'detail': f'✓ Congratulations! You have been successfully promoted to {promotion_label}.',
                'success': True,
                'promotion_type': resolved_type,
                'user_email': user.email,
                'next_step': 'You can now log in with your admin credentials at /admin/',
            },
            status=status.HTTP_200_OK
        )

