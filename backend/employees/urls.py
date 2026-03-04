from django.urls import path
from .views import EmployeeListCreateView, EmployeeDetailView, DepartmentListView, DashboardView

urlpatterns = [
    # Employee CRUD
    path("employees/", EmployeeListCreateView.as_view(), name="employee-list-create"),
    path("employees/<str:employee_id>/", EmployeeDetailView.as_view(), name="employee-detail"),

    # Supporting endpoints
    path("departments/", DepartmentListView.as_view(), name="department-list"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
]
