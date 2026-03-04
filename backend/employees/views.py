from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Employee, Department
from .serializers import EmployeeSerializer, EmployeeListSerializer


def error_response(message, status_code, details=None):
    """Consistent error envelope."""
    body = {"success": False, "message": message}
    if details:
        body["details"] = details
    return Response(body, status=status_code)


def success_response(data, message="", status_code=status.HTTP_200_OK):
    """Consistent success envelope."""
    return Response(
        {"success": True, "message": message, "data": data},
        status=status_code,
    )


# ── /api/v1/employees/ ────────────────────────────────────────────────────────

class EmployeeListCreateView(APIView):
    """
    GET  /api/v1/employees/        – list all employees (supports ?department= & ?search=)
    POST /api/v1/employees/        – create a new employee
    """

    def get(self, request):
        qs = Employee.objects.all()

        # Optional department filter
        dept = request.query_params.get("department", "").strip()
        if dept:
            valid_depts = [c[0] for c in Department.choices]
            if dept not in valid_depts:
                return error_response(
                    f'Invalid department "{dept}". Valid options: {", ".join(valid_depts)}',
                    status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(department=dept)

        # Optional search filter (employee_id, name, email)
        search = request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(employee_id__icontains=search)
                | Q(full_name__icontains=search)
                | Q(email__icontains=search)
            )

        serializer = EmployeeListSerializer(qs, many=True)
        return success_response(
            data=serializer.data,
            message=f"{len(serializer.data)} employee(s) found.",
        )

    def post(self, request):
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            employee = serializer.save()
            return success_response(
                data=EmployeeSerializer(employee).data,
                message="Employee created successfully.",
                status_code=status.HTTP_201_CREATED,
            )
        return error_response(
            message="Validation failed.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=serializer.errors,
        )


# ── /api/v1/employees/<employee_id>/ ─────────────────────────────────────────

class EmployeeDetailView(APIView):
    """
    GET    /api/v1/employees/<employee_id>/   – retrieve one employee
    PATCH  /api/v1/employees/<employee_id>/   – partial update
    DELETE /api/v1/employees/<employee_id>/   – delete
    """

    def _get_employee(self, employee_id):
        try:
            return Employee.objects.get(employee_id=employee_id.upper())
        except Employee.DoesNotExist:
            return None

    def get(self, request, employee_id):
        emp = self._get_employee(employee_id)
        if not emp:
            return error_response(
                f'Employee "{employee_id}" not found.',
                status.HTTP_404_NOT_FOUND,
            )
        return success_response(data=EmployeeSerializer(emp).data)

    def patch(self, request, employee_id):
        emp = self._get_employee(employee_id)
        if not emp:
            return error_response(
                f'Employee "{employee_id}" not found.',
                status.HTTP_404_NOT_FOUND,
            )
        serializer = EmployeeSerializer(emp, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return success_response(
                data=EmployeeSerializer(updated).data,
                message="Employee updated successfully.",
            )
        return error_response(
            message="Validation failed.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=serializer.errors,
        )

    def delete(self, request, employee_id):
        emp = self._get_employee(employee_id)
        if not emp:
            return error_response(
                f'Employee "{employee_id}" not found.',
                status.HTTP_404_NOT_FOUND,
            )
        name = emp.full_name
        emp.delete()  # cascades to attendance records via FK on_delete=CASCADE
        return success_response(
            data={"employee_id": employee_id},
            message=f'Employee "{name}" deleted successfully.',
        )


# ── /api/v1/departments/ ──────────────────────────────────────────────────────

class DepartmentListView(APIView):
    """
    GET /api/v1/departments/ – return all valid department choices.
    """

    def get(self, request):
        depts = [{"value": c[0], "label": c[1]} for c in Department.choices]
        return success_response(data=depts)


# ── /api/v1/dashboard/ ───────────────────────────────────────────────────────

class DashboardView(APIView):
    """
    GET /api/v1/dashboard/ – aggregated stats for the dashboard.
    """

    def get(self, request):
        from django.db.models import Count, Q
        from datetime import date
        from attendance.models import Attendance

        total_employees = Employee.objects.count()

        # Per-department breakdown
        dept_breakdown = (
            Employee.objects
            .values("department")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # Present today
        today = date.today()
        present_today = Attendance.objects.filter(
            date=today, status="Present"
        ).count()

        # Total attendance records
        total_attendance = Attendance.objects.count()

        # Present days per employee
        present_counts = (
            Attendance.objects
            .filter(status="Present")
            .values("employee__employee_id", "employee__full_name")
            .annotate(present_days=Count("id"))
            .order_by("-present_days")
        )

        return success_response(data={
            "total_employees": total_employees,
            "present_today": present_today,
            "total_attendance": total_attendance,
            "department_breakdown": list(dept_breakdown),
            "present_counts": list(present_counts),
        })
