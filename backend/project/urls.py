from django.contrib import admin
from django.urls import path, include
from django.urls import re_path
from django.http import JsonResponse
from django.shortcuts import render
from accounts.views import ShortURLRedirectView


def frontend_index_or_api_status(request):
    try:
        return render(request, 'index.html')
    except Exception:
        return JsonResponse(
            {
                'status': 'ok',
                'message': 'Backend is running. Frontend build is not available on this host.',
            }
        )


def healthz(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('', frontend_index_or_api_status),
    path('healthz/', healthz),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('s/<str:short_code>/', ShortURLRedirectView.as_view(), name='short-url-redirect'),
    re_path(r'^(?!api/|admin/|static/|healthz/).*$', frontend_index_or_api_status),
]
