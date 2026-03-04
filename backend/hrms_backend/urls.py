"""
HRMS Lite – Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    """Simple health-check endpoint for deployment platforms."""
    return JsonResponse({"status": "ok", "service": "HRMS Lite API"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),

    # API v1
    path("api/v1/", include("employees.urls")),
    path("api/v1/", include("attendance.urls")),
]
