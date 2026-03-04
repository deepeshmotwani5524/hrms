from rest_framework import serializers
from .models import Attendance, AttendanceStatus
from employees.models import Employee


class AttendanceReadSerializer(serializers.ModelSerializer):
    """
    Serializer for reading attendance – expands employee details inline.
    """
    employee_id = serializers.CharField(source="employee.employee_id", read_only=True)
    full_name = serializers.CharField(source="employee.full_name", read_only=True)
    department = serializers.CharField(source="employee.department", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "employee_id",
            "full_name",
            "department",
            "date",
            "status",
            "marked_at",
        ]


class AttendanceWriteSerializer(serializers.Serializer):
    """
    Serializer for marking / updating attendance.
    Accepts employee_id (the user-visible code) rather than the PK.
    """
    employee_id = serializers.CharField(max_length=20)
    date = serializers.DateField()
    status = serializers.ChoiceField(choices=AttendanceStatus.choices)

    def validate_employee_id(self, value):
        value = value.strip().upper()
        try:
            Employee.objects.get(employee_id=value)
        except Employee.DoesNotExist:
            raise serializers.ValidationError(
                f'Employee "{value}" does not exist.'
            )
        return value

    def validate_date(self, value):
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError(
                "Cannot mark attendance for a future date."
            )
        return value

    def save(self):
        """Upsert: update status if record already exists, else create."""
        employee = Employee.objects.get(employee_id=self.validated_data["employee_id"])
        record, created = Attendance.objects.update_or_create(
            employee=employee,
            date=self.validated_data["date"],
            defaults={"status": self.validated_data["status"]},
        )
        self._created = created
        return record

    @property
    def was_created(self):
        return getattr(self, "_created", False)
