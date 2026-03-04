from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Employee",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("employee_id", models.CharField(
                    help_text="Unique employee code, e.g. EMP001",
                    max_length=20,
                    unique=True,
                )),
                ("full_name", models.CharField(max_length=150)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("department", models.CharField(
                    choices=[
                        ("Engineering", "Engineering"),
                        ("Product", "Product"),
                        ("Design", "Design"),
                        ("Marketing", "Marketing"),
                        ("Operations", "Operations"),
                        ("HR", "HR"),
                        ("Finance", "Finance"),
                        ("Sales", "Sales"),
                    ],
                    max_length=50,
                )),
                ("created_at", models.DateField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Employee",
                "verbose_name_plural": "Employees",
                "ordering": ["employee_id"],
            },
        ),
    ]
