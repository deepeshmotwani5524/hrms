from django.db import models


class Department(models.TextChoices):
    ENGINEERING = "Engineering", "Engineering"
    PRODUCT = "Product", "Product"
    DESIGN = "Design", "Design"
    MARKETING = "Marketing", "Marketing"
    OPERATIONS = "Operations", "Operations"
    HR = "HR", "HR"
    FINANCE = "Finance", "Finance"
    SALES = "Sales", "Sales"


class Employee(models.Model):
    """
    Core employee record.

    employee_id is a user-supplied unique identifier (e.g. "EMP001").
    It is separate from the auto-generated primary key so that the
    frontend can display a meaningful, stable identifier.
    """
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique employee code, e.g. EMP001",
    )
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    department = models.CharField(
        max_length=50,
        choices=Department.choices,
    )
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["employee_id"]
        verbose_name = "Employee"
        verbose_name_plural = "Employees"

    def __str__(self):
        return f"{self.employee_id} – {self.full_name}"
