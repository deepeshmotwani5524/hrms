from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q

from .models import Attendance
from .serializers import AttendanceReadSerializer, AttendanceWriteSerializer
from employees.models import Employee


def error_response(message, status_code, details=None):
    body = {"success": False, "message": message}
    if details:
        body["details"] = details
    return Response(body, status=status_code)


def success_response(data, message="", status_code=status.HTTP_200_OK):
    return Response(
        {"success": True, "message": message, "data": data},
        status=status_code,
    )


# ── /api/v1/attendance/ ───────────────────────────────────────────────────────

class AttendanceListMarkView(APIView):
    """
    GET  /api/v1/attendance/   – list records; supports ?employee_id= & ?date= & ?status=
    POST /api/v1/attendance/   – mark (upsert) an attendance record
    """

    def get(self, request):
        qs = Attendance.objects.select_related("employee").all()

        # Filter by employee_id (user-visible code)
        emp_id = request.query_params.get("employee_id", "").strip().upper()
        if emp_id:
            if not Employee.objects.filter(employee_id=emp_id).exists():
                return error_response(
                    f'Employee "{emp_id}" not found.',
                    status.HTTP_404_NOT_FOUND,
                )
            qs = qs.filter(employee__employee_id=emp_id)

        # Filter by date (ISO 8601: YYYY-MM-DD)
        date_str = request.query_params.get("date", "").strip()
        if date_str:
            try:
                from datetime import date
                from datetime import datetime
                parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                qs = qs.filter(date=parsed_date)
            except ValueError:
                return error_response(
                    "Invalid date format. Use YYYY-MM-DD.",
                    status.HTTP_400_BAD_REQUEST,
                )

        # Filter by status
        att_status = request.query_params.get("status", "").strip()
        if att_status:
            if att_status not in ("Present", "Absent"):
                return error_response(
                    'Invalid status. Use "Present" or "Absent".',
                    status.HTTP_400_BAD_REQUEST,
                )
            qs = qs.filter(status=att_status)

        serializer = AttendanceReadSerializer(qs, many=True)

        # Bonus: annotate total present days per employee in the result set
        present_summary = (
            qs.filter(status="Present")
            .values("employee__employee_id")
            .annotate(present_days=Count("id"))
        )
        present_map = {
            r["employee__employee_id"]: r["present_days"]
            for r in present_summary
        }

        return success_response(
            data={
                "records": serializer.data,
                "total": len(serializer.data),
                "present_days_map": present_map,
            },
            message=f"{len(serializer.data)} record(s) found.",
        )

    def post(self, request):
        serializer = AttendanceWriteSerializer(data=request.data)
        if serializer.is_valid():
            record = serializer.save()
            read_serializer = AttendanceReadSerializer(record)
            http_status = (
                status.HTTP_201_CREATED
                if serializer.was_created
                else status.HTTP_200_OK
            )
            msg = "Attendance marked." if serializer.was_created else "Attendance updated."
            return success_response(
                data=read_serializer.data,
                message=msg,
                status_code=http_status,
            )
        return error_response(
            message="Validation failed.",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=serializer.errors,
        )


# ── /api/v1/attendance/<pk>/ ──────────────────────────────────────────────────

class AttendanceDetailView(APIView):
    """
    GET    /api/v1/attendance/<pk>/   – retrieve one record
    PATCH  /api/v1/attendance/<pk>/   – update status
    DELETE /api/v1/attendance/<pk>/   – delete one record
    """

    def _get_record(self, pk):
        try:
            return Attendance.objects.select_related("employee").get(pk=pk)
        except Attendance.DoesNotExist:
            return None

    def get(self, request, pk):
        record = self._get_record(pk)
        if not record:
            return error_response("Attendance record not found.", status.HTTP_404_NOT_FOUND)
        return success_response(data=AttendanceReadSerializer(record).data)

    def patch(self, request, pk):
        record = self._get_record(pk)
        if not record:
            return error_response("Attendance record not found.", status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status", "").strip()
        if new_status not in ("Present", "Absent"):
            return error_response(
                'Status must be "Present" or "Absent".',
                status.HTTP_400_BAD_REQUEST,
            )
        record.status = new_status
        record.save(update_fields=["status", "marked_at"])
        return success_response(
            data=AttendanceReadSerializer(record).data,
            message="Attendance record updated.",
        )

    def delete(self, request, pk):
        record = self._get_record(pk)
        if not record:
            return error_response("Attendance record not found.", status.HTTP_404_NOT_FOUND)
        record.delete()
        return success_response(data={"id": pk}, message="Attendance record deleted.")


# ── /api/v1/attendance/employee/<employee_id>/summary/ ────────────────────────

class EmployeeAttendanceSummaryView(APIView):
    """
    GET /api/v1/attendance/employee/<employee_id>/summary/
    Returns present/absent counts + full record list for one employee.
    """

    def get(self, request, employee_id):
        employee_id = employee_id.upper()
        try:
            employee = Employee.objects.get(employee_id=employee_id)
        except Employee.DoesNotExist:
            return error_response(
                f'Employee "{employee_id}" not found.',
                status.HTTP_404_NOT_FOUND,
            )

        qs = Attendance.objects.filter(employee=employee).order_by("-date")
        records = AttendanceReadSerializer(qs, many=True).data

        present = qs.filter(status="Present").count()
        absent = qs.filter(status="Absent").count()

        return success_response(data={
            "employee_id": employee.employee_id,
            "full_name": employee.full_name,
            "department": employee.department,
            "total_days_recorded": qs.count(),
            "present_days": present,
            "absent_days": absent,
            "attendance_rate": round((present / qs.count() * 100), 1) if qs.count() else 0,
            "records": records,
        })
