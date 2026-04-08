from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    SignupView, OTPVerifyView, LoginView,
    ForgotPasswordView, ResetPasswordView, ResendOTPView,
    UserProfileView, AdminUsersListView, AdminUsersExportView, AdminUserPermissionView,
    SMSSendView, SMSMessageListView, SMSMessageStatusView,
    SMSCredentialView, UserSMSEligibilityView, AdminUsersSMSListView,
    SMSContactGroupView, SMSShortURLView, SMSShortURLDetailView,
    SMSTimezoneListView,
    FreeTrialSendOTPView, FreeTrialVerifyOTPView, FreeTrialVerifiedNumbersView,
    FreeTrialSendSMSView, SMSUsageSummaryView,
    AdminNotificationPreviewView, AdminNotificationSendView,
    AdminNotificationHistoryView, UserNotificationListView,
    UserNotificationReadView,
)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('verify-otp/', OTPVerifyView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('admin/users/', AdminUsersListView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/permissions/', AdminUserPermissionView.as_view(), name='admin-user-permissions'),
    path('admin/users/export/', AdminUsersExportView.as_view(), name='admin-users-export'),
    
    # SMS endpoints
    path('sms/send/', SMSSendView.as_view(), name='sms-send'),
    path('sms/messages/', SMSMessageListView.as_view(), name='sms-messages'),
    path('sms/messages/<int:pk>/', SMSMessageStatusView.as_view(), name='sms-status'),
    path('sms/credentials/', SMSCredentialView.as_view(), name='sms-credentials'),
    path('sms/users/<int:user_id>/eligibility/', UserSMSEligibilityView.as_view(), name='sms-eligibility'),
    path('sms/admin/users/', AdminUsersSMSListView.as_view(), name='sms-admin-users'),
    path('sms/groups/', SMSContactGroupView.as_view(), name='sms-groups'),
    path('sms/short-urls/', SMSShortURLView.as_view(), name='sms-short-urls'),
    path('sms/short-urls/<int:url_id>/', SMSShortURLDetailView.as_view(), name='sms-short-url-detail'),
    path('sms/timezones/', SMSTimezoneListView.as_view(), name='sms-timezones'),
    path('sms/usage-summary/', SMSUsageSummaryView.as_view(), name='sms-usage-summary'),
    path('sms/free-trial/send-otp/', FreeTrialSendOTPView.as_view(), name='sms-free-trial-send-otp'),
    path('sms/free-trial/verify-otp/', FreeTrialVerifyOTPView.as_view(), name='sms-free-trial-verify-otp'),
    path('sms/free-trial/verified-numbers/', FreeTrialVerifiedNumbersView.as_view(), name='sms-free-trial-verified-numbers'),
    path('sms/free-trial/send/', FreeTrialSendSMSView.as_view(), name='sms-free-trial-send'),

    # Internal notifications (no external credentials required)
    path('admin/notifications/preview/', AdminNotificationPreviewView.as_view(), name='admin-notifications-preview'),
    path('admin/notifications/send/', AdminNotificationSendView.as_view(), name='admin-notifications-send'),
    path('admin/notifications/history/', AdminNotificationHistoryView.as_view(), name='admin-notifications-history'),
    path('notifications/my/', UserNotificationListView.as_view(), name='notifications-my-list'),
    path('notifications/my/<int:recipient_id>/read/', UserNotificationReadView.as_view(), name='notifications-my-read'),
]


