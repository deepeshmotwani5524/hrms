from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("employees", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Attendance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("employee", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="attendance_records",
                    to="employees.employee",
                )),
                ("date", models.DateField()),
                ("status", models.CharField(
                    choices=[("Present", "Present"), ("Absent", "Absent")],
                    max_length=10,
                )),
                ("marked_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Attendance Record",
                "verbose_name_plural": "Attendance Records",
                "ordering": ["-date", "employee__employee_id"],
                "unique_together": {("employee", "date")},
            },
        ),
    ]
