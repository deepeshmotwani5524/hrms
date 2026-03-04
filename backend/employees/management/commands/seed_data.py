"""
Management command: python manage.py seed_data

Populates the database with sample employees and attendance records
for development / demo purposes.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = "Seed the database with sample employees and attendance data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing data before seeding.",
        )

    def handle(self, *args, **options):
        from employees.models import Employee
        from attendance.models import Attendance

        if options["clear"]:
            Attendance.objects.all().delete()
            Employee.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing data."))

        # ── Employees ──────────────────────────────────────────────────────────
        employees_data = [
            {"employee_id": "EMP001", "full_name": "Arjun Sharma",  "email": "arjun.sharma@company.com",  "department": "Engineering"},
            {"employee_id": "EMP002", "full_name": "Priya Patel",   "email": "priya.patel@company.com",   "department": "Product"},
            {"employee_id": "EMP003", "full_name": "Rohan Mehta",   "email": "rohan.mehta@company.com",   "department": "Design"},
            {"employee_id": "EMP004", "full_name": "Sneha Gupta",   "email": "sneha.gupta@company.com",   "department": "Marketing"},
            {"employee_id": "EMP005", "full_name": "Vikram Singh",  "email": "vikram.singh@company.com",  "department": "Engineering"},
            {"employee_id": "EMP006", "full_name": "Ananya Reddy",  "email": "ananya.reddy@company.com",  "department": "HR"},
            {"employee_id": "EMP007", "full_name": "Karan Malhotra","email": "karan.malhotra@company.com","department": "Finance"},
            {"employee_id": "EMP008", "full_name": "Divya Nair",    "email": "divya.nair@company.com",    "department": "Sales"},
        ]

        created_employees = []
        for data in employees_data:
            emp, created = Employee.objects.get_or_create(
                employee_id=data["employee_id"],
                defaults=data,
            )
            created_employees.append(emp)
            status = "Created" if created else "Already exists"
            self.stdout.write(f"  {status}: {emp.employee_id} – {emp.full_name}")

        # ── Attendance (last 30 working days) ─────────────────────────────────
        today = date.today()
        att_created = 0

        for i in range(30):
            day = today - timedelta(days=i + 1)
            if day.weekday() >= 5:  # skip weekends
                continue
            for emp in created_employees:
                # ~80% present rate
                att_status = "Present" if random.random() < 0.80 else "Absent"
                _, created = Attendance.objects.get_or_create(
                    employee=emp,
                    date=day,
                    defaults={"status": att_status},
                )
                if created:
                    att_created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✓ Seeded {len(created_employees)} employees "
                f"and {att_created} attendance records."
            )
        )
