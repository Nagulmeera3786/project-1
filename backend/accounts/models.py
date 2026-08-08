import secrets
import uuid
import string
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.conf import settings


def generate_email_validation_dlr_unique_id():
    """Legacy helper kept for historical migration compatibility."""
    from django.apps import apps

    history_model = apps.get_model('accounts', 'EmailValidationHistory')
    alphabet = string.ascii_uppercase + string.digits

    for _ in range(50):
        candidate = ''.join(secrets.choice(alphabet) for _ in range(8))
        if not history_model.objects.filter(dlr_unique_id=candidate).exists():
            return candidate

    return uuid.uuid4().hex[:8].upper()


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


class SenderIdRequest(models.Model):
    STATUS_PROGRESS = 'progress'
    STATUS_COMPLETED = 'completed'
    STATUS_REJECTED = 'rejected'
    # Backward-compatible aliases for legacy status names.
    STATUS_IN_PROGRESS = STATUS_PROGRESS
    STATUS_IGNORED = STATUS_REJECTED
    STATUS_FAILED = STATUS_REJECTED
    STATUS_CHOICES = [
        (STATUS_PROGRESS, 'Progress'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    PRIMARY_USE_CASE_OTP = 'otp'
    PRIMARY_USE_CASE_TWO_FACTOR = 'two_factor_authentication'
    PRIMARY_USE_CASE_TRANSACTIONAL = 'transactional_notifications'
    PRIMARY_USE_CASE_CRITICAL = 'critical_alerts'
    PRIMARY_USE_CASE_CUSTOMER_SERVICE = 'customer_service'
    PRIMARY_USE_CASE_MARKETING = 'marketing_promotions'
    PRIMARY_USE_CASE_CHOICES = [
        (PRIMARY_USE_CASE_OTP, 'OTP'),
        (PRIMARY_USE_CASE_TWO_FACTOR, 'Two-Factor authentication'),
        (PRIMARY_USE_CASE_TRANSACTIONAL, 'Transactional Notifications'),
        (PRIMARY_USE_CASE_CRITICAL, 'Critical alerts'),
        (PRIMARY_USE_CASE_CUSTOMER_SERVICE, 'Customer service'),
        (PRIMARY_USE_CASE_MARKETING, 'Marketing promotions'),
    ]

    INDUSTRY_FINTECH = 'fintech'
    INDUSTRY_HEALTHCARE = 'healthcare'
    INDUSTRY_EDUCATION = 'education'
    INDUSTRY_ECOMMERCE = 'ecommerce'
    INDUSTRY_TELECOM = 'telecom'
    INDUSTRY_LOGISTICS = 'logistics'
    INDUSTRY_GOVERNMENT = 'government'
    INDUSTRY_RETAIL = 'retail'
    INDUSTRY_MANUFACTURING = 'manufacturing'
    INDUSTRY_TRAVEL = 'travel'
    INDUSTRY_OTHER = 'other'
    INDUSTRY_CHOICES = [
        (INDUSTRY_FINTECH, 'Fintech'),
        (INDUSTRY_HEALTHCARE, 'Healthcare'),
        (INDUSTRY_EDUCATION, 'Education'),
        (INDUSTRY_ECOMMERCE, 'E-commerce'),
        (INDUSTRY_TELECOM, 'Telecom'),
        (INDUSTRY_LOGISTICS, 'Logistics'),
        (INDUSTRY_GOVERNMENT, 'Government'),
        (INDUSTRY_RETAIL, 'Retail'),
        (INDUSTRY_MANUFACTURING, 'Manufacturing'),
        (INDUSTRY_TRAVEL, 'Travel'),
        (INDUSTRY_OTHER, 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender_id_requests')
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    contact_number = models.CharField(max_length=25)
    required_sender_id = models.CharField(max_length=20)
    destination_country = models.CharField(max_length=100)
    primary_use_case = models.CharField(max_length=60, choices=PRIMARY_USE_CASE_CHOICES)
    company_name = models.CharField(max_length=200)
    industry_sector_type = models.CharField(max_length=50, choices=INDUSTRY_CHOICES)
    company_website = models.URLField(max_length=500)
    message_content = models.TextField()
    company_documentation = models.FileField(upload_to='sender_id_requests/', blank=False, null=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PROGRESS)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Sender ID request from {self.full_name} ({self.required_sender_id})"


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


class WalletRechargePayment(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_SUCCESSFUL = 'successful'
    STATUS_FAILED = 'failed'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_SUCCESSFUL, 'Successful'),
        (STATUS_FAILED, 'Failed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet_recharge_payments')
    entered_amount = models.DecimalField(max_digits=12, decimal_places=2)
    service_charge_percentage = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    tax_percentage = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    service_charge_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')

    razorpay_order_id = models.CharField(max_length=100, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, default='')
    razorpay_signature = models.CharField(max_length=255, blank=True, default='')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    failure_reason = models.TextField(blank=True, default='')
    credited_amount = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    credited_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Recharge {self.razorpay_order_id} ({self.status})"


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
    dlr_unique_id = models.CharField(max_length=120, blank=True, default='UNKNOWN')
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


class EmailValidationIPWhitelistRequest(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ip_whitelist_requests')
    requested_ip = models.GenericIPAddressField()
    request_note = models.CharField(max_length=500, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    admin_notes = models.CharField(max_length=500, blank=True, default='')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_ip_whitelist_requests',
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} requested {self.requested_ip} ({self.status})"


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

