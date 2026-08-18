import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{}|;:'\",.<>/?`~\\"


class StrongPasswordValidator:
    """Require at least one digit and one special character in the password."""

    def validate(self, password, user=None):
        errors = []
        if not re.search(r'\d', password or ''):
            errors.append(_('This password must contain at least one number.'))
        if not any(ch in SPECIAL_CHARACTERS for ch in (password or '')):
            errors.append(_('This password must contain at least one special character (e.g. ! @ # $ % &).'))
        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return _('Your password must contain at least one number and one special character.')
