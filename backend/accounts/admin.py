from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import User, SMSMessage, SMSCredential, SMSContactGroup
from .utils import send_admin_promotion_confirmation_email
import secrets
from django.utils import timezone


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """
    Custom User Admin with extended fields for SMS management
    and admin role management capabilities
    """
    
    list_display = (
        'email',
        'username',
        'admin_badge',
        'staff_badge',
        'is_sms_enabled',
        'phone_number',
        'is_active',
    )
    
    list_filter = (
        'is_staff',
        'is_superuser',
        'is_active',
        'is_sms_enabled',
        'date_joined',
    )
    
    search_fields = ('email', 'username', 'phone_number')
    
    fieldsets = (
        ('Authentication', {
            'fields': ('username', 'email', 'password')
        }),
        ('Admin Privileges', {
            'fields': ('is_staff', 'is_superuser', 'pending_admin_promotion', 'admin_promotion_requested_at'),
            'description': mark_safe(
                '<strong>⚠️ Admin Settings:</strong><br>'
                '• <strong>is_staff:</strong> Can access Django admin panel<br>'
                '• <strong>is_superuser:</strong> Full admin access with all permissions<br>'
                '• <strong>pending_admin_promotion:</strong> Awaiting email confirmation'
            )
        }),
        ('SMS Management & Eligibility', {
            'fields': (
                'is_sms_enabled',
                'phone_number',
                'otp_code',
                'otp_created',
                'sender_id_type',
                'sender_id',
                'free_trial_sender_id',
            ),
            'classes': ('collapse',),
        }),
        ('Permissions', {
            'fields': ('groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ('last_login', 'date_joined', 'otp_created', 'pending_admin_promotion', 'admin_promotion_requested_at')
    
    actions = [
        'request_admin_promotion',
        'request_staff_promotion',
        'revoke_admin',
        'revoke_staff',
        'enable_sms',
        'disable_sms',
    ]
    
    def admin_badge(self, obj):
        """Display admin status badge"""
        if obj.is_superuser:
            return format_html(
                '<span style="background-color: #d81b60; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">ADMIN</span>'
            )
        elif obj.is_staff:
            return format_html(
                '<span style="background-color: #1976d2; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">STAFF</span>'
            )
        else:
            return format_html(
                '<span style="background-color: #ccc; color: #333; padding: 3px 8px; border-radius: 3px;">USER</span>'
            )
    admin_badge.short_description = 'Admin Status'
    
    def staff_badge(self, obj):
        """Display staff status indicator"""
        if obj.is_staff:
            return format_html('✓ Yes')
        else:
            return format_html('✗ No')
    staff_badge.short_description = 'Staff Access'

    @admin.action(
        description='📧 Request FULL ADMIN promotion (email confirmation)',
        permissions=['change']
    )
    def request_admin_promotion(self, request, queryset):
        sent_count = 0
        skipped_count = 0

        for user in queryset:
            if not user.email:
                skipped_count += 1
                continue
            if user.is_superuser and user.is_staff:
                skipped_count += 1
                continue

            token = secrets.token_urlsafe(32)
            user.admin_promotion_token = token
            user.pending_admin_promotion = True
            user.admin_promotion_requested_at = timezone.now()
            user.save(update_fields=['admin_promotion_token', 'pending_admin_promotion', 'admin_promotion_requested_at'])

            if send_admin_promotion_confirmation_email(user, token):
                sent_count += 1
            else:
                user.admin_promotion_token = None
                user.pending_admin_promotion = False
                user.admin_promotion_requested_at = None
                user.save(update_fields=['admin_promotion_token', 'pending_admin_promotion', 'admin_promotion_requested_at'])
                skipped_count += 1

        self.message_user(request, f'Confirmation sent: {sent_count} | Skipped/failed: {skipped_count}')

    @admin.action(
        description='📧 Request STAFF promotion (email confirmation)',
        permissions=['change']
    )
    def request_staff_promotion(self, request, queryset):
        sent_count = 0
        skipped_count = 0

        for user in queryset:
            if not user.email:
                skipped_count += 1
                continue
            if user.is_staff and not user.is_superuser:
                skipped_count += 1
                continue

            token = secrets.token_urlsafe(32)
            user.admin_promotion_token = f'staff::{token}'
            user.pending_admin_promotion = True
            user.admin_promotion_requested_at = timezone.now()
            user.save(update_fields=['admin_promotion_token', 'pending_admin_promotion', 'admin_promotion_requested_at'])

            if send_admin_promotion_confirmation_email(user, user.admin_promotion_token):
                sent_count += 1
            else:
                user.admin_promotion_token = None
                user.pending_admin_promotion = False
                user.admin_promotion_requested_at = None
                user.save(update_fields=['admin_promotion_token', 'pending_admin_promotion', 'admin_promotion_requested_at'])
                skipped_count += 1

        self.message_user(request, f'Confirmation sent: {sent_count} | Skipped/failed: {skipped_count}')
    
    
    @admin.action(
        description='✗ Revoke ADMIN from selected users',
        permissions=['change']
    )
    def revoke_admin(self, request, queryset):
        """Revoke admin privileges"""
        updated = queryset.update(
            is_staff=False,
            is_superuser=False,
            pending_admin_promotion=False,
            admin_promotion_token=None,
            admin_promotion_requested_at=None,
        )
        self.message_user(request, f'✗ {updated} user(s) revoked to regular users')
    
    @admin.action(
        description='✗ Revoke STAFF from selected users',
        permissions=['change']
    )
    def revoke_staff(self, request, queryset):
        """Revoke staff privileges but keep as user"""
        updated = queryset.update(is_staff=False, is_superuser=False)
        self.message_user(request, f'✗ {updated} user(s) revoked from staff')
    
    @admin.action(
        description='✓ Enable SMS for selected users',
        permissions=['change']
    )
    def enable_sms(self, request, queryset):
        """Enable SMS capability for selected users"""
        updated = queryset.update(is_sms_enabled=True)
        self.message_user(request, f'✓ SMS enabled for {updated} user(s)')
    
    @admin.action(
        description='✗ Disable SMS for selected users',
        permissions=['change']
    )
    def disable_sms(self, request, queryset):
        """Disable SMS capability for selected users"""
        updated = queryset.update(is_sms_enabled=False)
        self.message_user(request, f'✗ SMS disabled for {updated} user(s)')


@admin.register(SMSMessage)
class SMSMessageAdmin(admin.ModelAdmin):
    """Admin interface for SMS messages"""
    
    list_display = (
        'recipient_number',
        'display_sender_id',
        'sms_type',
        'status_badge',
        'created_at',
        'sender',
    )
    
    list_filter = ('status', 'sms_type', 'send_mode', 'created_at')
    search_fields = ('recipient_number', 'message_content', 'sender__email')
    readonly_fields = ('created_at', 'updated_at', 'message_id', 'delivery_time')
    
    fieldsets = (
        ('Message Details', {
            'fields': ('sender', 'recipient_number', 'recipient_user', 'message_content')
        }),
        ('Sender Configuration', {
            'fields': ('display_sender_id', 'sms_type', 'send_mode')
        }),
        ('Scheduling', {
            'fields': ('schedule_type', 'scheduled_at', 'timezone_name'),
            'classes': ('collapse',),
        }),
        ('Batch Information', {
            'fields': ('batch_reference', 'source_file_name'),
            'classes': ('collapse',),
        }),
        ('Status & Delivery', {
            'fields': (
                'status',
                'message_id',
                'failure_reason',
                'delivery_time',
            ),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def status_badge(self, obj):
        """Display status with color-coded badge"""
        colors = {
            'pending': '#ff9800',      # Orange
            'sent': '#2196f3',         # Blue
            'delivered': '#4caf50',    # Green
            'failed': '#f44336',       # Red
        }
        color = colors.get(obj.status, '#ccc')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.status.upper()
        )
    status_badge.short_description = 'Status'


@admin.register(SMSCredential)
class SMSCredentialAdmin(admin.ModelAdmin):
    """Admin interface for SMS provider credentials (ADMIN ONLY)"""
    
    list_display = ('id', 'is_active', 'sender_ids_preview', 'updated_at')
    list_filter = ('is_active', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('SMS Provider Credentials', {
            'fields': ('user', 'password'),
            'description': mark_safe(
                '<strong>⚠️ Sensitive Data:</strong> These are your SMS provider credentials. Keep them confidential.'
            )
        }),
        ('Sender IDs', {
            'fields': ('sender_ids', 'free_trial_default_sender_id'),
        }),
        ('Status', {
            'fields': ('is_active',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def sender_ids_preview(self, obj):
        """Display sender IDs in list view"""
        if obj.sender_ids:
            ids = ', '.join(str(sid)[:20] for sid in obj.sender_ids[:3])
            if len(obj.sender_ids) > 3:
                ids += f'... (+{len(obj.sender_ids) - 3} more)'
            return ids
        return '-'
    sender_ids_preview.short_description = 'Sender IDs'
    
    def has_delete_permission(self, request):
        """Prevent accidental deletion of credentials"""
        return False


@admin.register(SMSContactGroup)
class SMSContactGroupAdmin(admin.ModelAdmin):
    """Admin interface for SMS contact groups"""
    
    list_display = ('name', 'owner', 'created_at')
    list_filter = ('created_at', 'owner')
    search_fields = ('name', 'owner__email')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Contact Group', {
            'fields': ('owner', 'name')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
