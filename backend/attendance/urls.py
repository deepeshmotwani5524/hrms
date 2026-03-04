from django.urls import path
from .views import (
    AttendanceListMarkView,
    AttendanceDetailView,
    EmployeeAttendanceSummaryView,
)

urlpatterns = [
    # List all / mark attendance
    path("attendance/", AttendanceListMarkView.as_view(), name="attendance-list-mark"),

    # Single record operations
    path("attendance/<int:pk>/", AttendanceDetailView.as_view(), name="attendance-detail"),

    # Per-employee summary
    path(
        "attendance/employee/<str:employee_id>/summary/",
        EmployeeAttendanceSummaryView.as_view(),
        name="attendance-employee-summary",
    ),
]
