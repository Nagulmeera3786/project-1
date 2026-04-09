from django.conf import settings
from django.http import HttpResponseForbidden


class PrimaryAdminOnlyMiddleware:
    """Restrict Django /admin access to PRIMARY_ADMIN_EMAIL only."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path or ''
        if path.startswith('/admin') and request.user.is_authenticated:
            primary_admin_email = str(getattr(settings, 'PRIMARY_ADMIN_EMAIL', '') or '').strip().lower()
            request_email = str(getattr(request.user, 'email', '') or '').strip().lower()

            if request_email != primary_admin_email:
                return HttpResponseForbidden('Only primary admin can access admin portal.')

        return self.get_response(request)
