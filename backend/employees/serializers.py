from rest_framework import serializers
from .models import Employee, Department


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Full serializer used for create / retrieve / list operations.
    Validates uniqueness of employee_id and email.
    """

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_id",
            "full_name",
            "email",
            "department",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    # ── Field-level validation ────────────────────────────────────────────────

    def validate_employee_id(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Employee ID cannot be blank.")
        # On update, exclude the current instance from the uniqueness check.
        qs = Employee.objects.filter(employee_id=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f'Employee ID "{value}" is already in use.'
            )
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        qs = Employee.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This email address is already in use.")
        return value

    def validate_department(self, value):
        valid = [c[0] for c in Department.choices]
        if value not in valid:
            raise serializers.ValidationError(
                f'Invalid department. Choose from: {", ".join(valid)}'
            )
        return value

    def validate_full_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError(
                "Full name must be at least 2 characters."
            )
        return value


class EmployeeListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views (no updated_at noise).
    """

    class Meta:
        model = Employee
        fields = ["id", "employee_id", "full_name", "email", "department", "created_at"]
