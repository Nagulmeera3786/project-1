from .views import (  # Compatibility wrapper: implementation moved to views.py
    SMSSendView,
    SMSMessageListView,
    SMSMessageStatusView,
    SMSCredentialView,
    UserSMSEligibilityView,
    AdminUsersSMSListView,
)

__all__ = [
    'SMSSendView',
    'SMSMessageListView',
    'SMSMessageStatusView',
    'SMSCredentialView',
    'UserSMSEligibilityView',
    'AdminUsersSMSListView',
]

