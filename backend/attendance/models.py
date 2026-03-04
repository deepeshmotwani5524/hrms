from django.db import models
from employees.models import Employee


class AttendanceStatus(models.TextChoices):
    PRESENT = "Present", "Present"
    ABSENT = "Absent", "Absent"


class Attendance(models.Model):
    """
    Daily attendance record for one employee.

    The combination of (employee, date) is unique – marking attendance
    twice on the same day upserts the existing record (handled in the view).
    """
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=AttendanceStatus.choices,
    )
    marked_at = models.DateTimeField(auto_now=True)

    class Meta:
        # One record per employee per day
        unique_together = [("employee", "date")]
        ordering = ["-date", "employee__employee_id"]
        verbose_name = "Attendance Record"
        verbose_name_plural = "Attendance Records"

    def __str__(self):
        return f"{self.employee.employee_id} | {self.date} | {self.status}"
