import secrets
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.conf import settings


class User(AbstractUser):
    SENDER_ID_TYPE_CHOICES = [
        ('numeric', 'Numeric'),
        ('alphanumeric', 'Alphanumeric'),
    ]

    phone_number = models.CharField(max_length=15, blank=True, null=True)
    # OTP fields
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created = models.DateTimeField(blank=True, null=True)
    # SMS eligibility flag
    is_sms_enabled = models.BooleanField(default=False, help_text="User can receive SMS from admin")
    sender_id_type = models.CharField(max_length=20, choices=SENDER_ID_TYPE_CHOICES, default='alphanumeric')
    sender_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    free_trial_sender_id = models.CharField(max_length=50, blank=True, null=True)

    # Admin promotion workflow
    pending_admin_promotion = models.BooleanField(default=False, help_text="User has pending admin promotion that requires email confirmation")
    admin_promotion_token = models.CharField(max_length=100, blank=True, null=True, unique=True, help_text="Unique token for admin promotion confirmation")
    admin_promotion_requested_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.email or self.username


class SMSMessage(models.Model):
    SEND_MODE_CHOICES = [
        ('single', 'Single'),
        ('file_numbers', 'File Numbers'),
        ('personalized_file', 'Personalized File'),
        ('group', 'Group'),
        ('free_trial', 'Free Trial'),
    ]

    SMS_TYPE_CHOICES = [
        ('transactional', 'Transactional'),
        ('promotional', 'Promotional'),
        ('service', 'Service'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_sms')
    recipient_number = models.CharField(max_length=20)
    recipient_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_sms')
    display_sender_id = models.CharField(max_length=50, help_text="Sender ID displayed to recipient")
    message_content = models.TextField()
    sms_type = models.CharField(max_length=20, choices=SMS_TYPE_CHOICES, default='transactional')
    send_mode = models.CharField(max_length=30, choices=SEND_MODE_CHOICES, default='single')
    schedule_type = models.CharField(max_length=20, choices=[('instant', 'Instant'), ('scheduled', 'Scheduled')], default='instant')
    scheduled_at = models.DateTimeField(blank=True, null=True)
    timezone_name = models.CharField(max_length=100, blank=True, default='')
    batch_reference = models.CharField(max_length=64, blank=True, default='')
    source_file_name = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    provider_message_id = models.CharField(max_length=150, blank=True, default='')
    failure_reason = models.TextField(blank=True, default='')
    delivery_time = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"SMS from {self.display_sender_id} to {self.recipient_number} - {self.status}"


class SMSCredential(models.Model):
    """Store encrypted SMS provider credentials - ADMIN ONLY"""
    user = models.CharField(max_length=100, help_text="Profile ID from SMS provider")
    password = models.CharField(max_length=100, help_text="Password from SMS provider")
    sender_ids = models.JSONField(default=list, help_text="List of approved sender IDs")
    free_trial_default_sender_id = models.CharField(max_length=50, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "SMS Credentials"
    
    def __str__(self):
        return f"SMS Credentials (Active: {self.is_active})"


class SMSContactGroup(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sms_contact_groups')
    name = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('owner', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.owner_id})"


class SMSContact(models.Model):
    group = models.ForeignKey(SMSContactGroup, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=120, blank=True, default='')
    phone_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'phone_number')
        ordering = ['id']

    def __str__(self):
        return f"{self.phone_number} ({self.group_id})"


class SMSShortURL(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sms_short_urls')
    link_name = models.CharField(max_length=120)
    short_code = models.CharField(max_length=12, unique=True)
    redirect_url = models.URLField(max_length=1000)
    is_active = models.BooleanField(default=True)
    total_clicks = models.PositiveIntegerField(default=0)
    last_clicked_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.link_name} -> {self.short_code}"


class FreeTrialVerifiedNumber(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='free_trial_numbers')
    phone_number = models.CharField(max_length=20)
    otp_code = models.CharField(max_length=6, blank=True, default='')
    otp_created = models.DateTimeField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('owner', 'phone_number')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.owner_id}:{self.phone_number} ({'verified' if self.is_verified else 'pending'})"


class InternalNotification(models.Model):
    AUDIENCE_CHOICES = [
        ('all_users', 'All Users'),
        ('verified_users', 'Verified Users'),
        ('not_verified_users', 'Not Verified Users'),
        ('new_joiners', 'New Joiners'),
        ('active_users', 'Active Users'),
        ('inactive_users', 'Inactive Users'),
        ('free_trial_users', 'Free Trial Users'),
        ('non_free_trial_users', 'Non Free Trial Users'),
    ]

    content = models.TextField()
    audience_filter = models.CharField(max_length=50, choices=AUDIENCE_CHOICES, default='all_users')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_notifications')
    recipient_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification {self.id} ({self.audience_filter})"


class InternalNotificationRecipient(models.Model):
    notification = models.ForeignKey(InternalNotification, on_delete=models.CASCADE, related_name='recipients')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='internal_notifications')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('notification', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification {self.notification_id} -> User {self.user_id}"


# ─── New feature models ────────────────────────────────────────────────────────

class UserWallet(models.Model):
    """Stores user credits / balance."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    email_validation_balance = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} wallet: {self.balance}"


class PlatformSetting(models.Model):
    """Admin-controlled key-value settings (e.g. email_validation_cost_per_request)."""
    key = models.CharField(max_length=100, unique=True)
    value = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}={self.value}"


class UserAPIKey(models.Model):
    """Per-user API keys for external access to email validation endpoints."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='api_keys')
    name = models.CharField(max_length=100, blank=True, default='Default Key')
    key = models.CharField(max_length=64, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def generate_key(cls):
        return secrets.token_hex(32)

    def __str__(self):
        return f"{self.user.email} - {self.name}"


class EmailValidationHistory(models.Model):
    """Tracks every email validation request including source (dashboard/api)."""
    SOURCE_DASHBOARD = 'dashboard'
    SOURCE_API = 'api'
    SOURCE_CHOICES = [
        (SOURCE_DASHBOARD, 'Dashboard'),
        (SOURCE_API, 'API'),
    ]
    STATUS_PENDING = 'pending'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_validations')
    api_key = models.ForeignKey(UserAPIKey, on_delete=models.SET_NULL, null=True, blank=True, related_name='validations')
    request_id = models.CharField(max_length=80, unique=True, blank=True, default='')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default=SOURCE_DASHBOARD)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    # email(s) requested
    email_count = models.PositiveIntegerField(default=1)
    emails_requested = models.JSONField(default=list)
    # compact results stored as JSON
    results_summary = models.JSONField(default=list)
    # cost deducted
    cost_deducted = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    file_name = models.CharField(max_length=255, blank=True, default='')
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} validated {self.email_count} email(s) via {self.source}"


class Employee(models.Model):
    """Employee profile linked to a User account with dual-OTP signup."""
    STATUS_PENDING = 'pending'
    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INACTIVE, 'Inactive'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_profile')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    # OTP sent to admin for approval
    admin_otp = models.CharField(max_length=6, blank=True, default='')
    admin_otp_created = models.DateTimeField(blank=True, null=True)
    admin_otp_verified = models.BooleanField(default=False)
    # OTP sent to employee
    employee_otp_verified = models.BooleanField(default=False)
    department = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Employee: {self.user.email} ({self.status})"

