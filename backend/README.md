# HRMS Lite — Backend API (Django + DRF)

RESTful backend for the HRMS Lite application, built with **Django 5** and **Django REST Framework**.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Django 5.0                          |
| API        | Django REST Framework 3.15          |
| Database   | SQLite (dev) / PostgreSQL (prod)    |
| CORS       | django-cors-headers                 |
| Server     | Gunicorn                            |
| Deployment | Render / Railway / any PaaS         |

---

## Project Structure

```
hrms_backend/
├── hrms_backend/          # Project settings & root URLs
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── employees/             # Employee app
│   ├── models.py          # Employee model
│   ├── serializers.py     # Validation + serialization
│   ├── views.py           # APIViews
│   ├── urls.py
│   ├── admin.py
│   └── management/
│       └── commands/
│           └── seed_data.py
├── attendance/            # Attendance app
│   ├── models.py          # Attendance model (FK → Employee)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
├── requirements.txt
├── manage.py
├── Procfile               # Heroku / Railway
├── render.yaml            # Render deployment
└── .env.example
```

---

## Local Setup

```bash
# 1. Clone & enter directory
git clone <repo-url>
cd hrms_backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env — at minimum set SECRET_KEY

# 5. Run migrations
python manage.py migrate

# 6. (Optional) Seed sample data
python manage.py seed_data

# 7. Start server
python manage.py runserver
```

API is available at **http://localhost:8000/api/v1/**

---

## API Reference

### Base URL
```
http://localhost:8000/api/v1/
```

### Response Envelope
All responses follow a consistent shape:
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```
Error responses:
```json
{
  "success": false,
  "message": "What went wrong",
  "details": { "field": ["error detail"] }
}
```

---

### Employees

| Method | Endpoint                       | Description                            |
|--------|--------------------------------|----------------------------------------|
| GET    | `/api/v1/employees/`           | List all employees                     |
| POST   | `/api/v1/employees/`           | Create a new employee                  |
| GET    | `/api/v1/employees/<id>/`      | Get single employee                    |
| PATCH  | `/api/v1/employees/<id>/`      | Partial update                         |
| DELETE | `/api/v1/employees/<id>/`      | Delete employee (cascades attendance)  |

**Query params for GET /employees/**
- `?search=<text>` — search by name, ID, or email
- `?department=Engineering` — filter by department

**Create employee body:**
```json
{
  "employee_id": "EMP009",
  "full_name": "Rahul Verma",
  "email": "rahul.verma@company.com",
  "department": "Engineering"
}
```

**Valid departments:** Engineering, Product, Design, Marketing, Operations, HR, Finance, Sales

---

### Attendance

| Method | Endpoint                                        | Description                     |
|--------|-------------------------------------------------|---------------------------------|
| GET    | `/api/v1/attendance/`                           | List attendance records         |
| POST   | `/api/v1/attendance/`                           | Mark / upsert attendance        |
| GET    | `/api/v1/attendance/<pk>/`                      | Get single record               |
| PATCH  | `/api/v1/attendance/<pk>/`                      | Update status                   |
| DELETE | `/api/v1/attendance/<pk>/`                      | Delete record                   |
| GET    | `/api/v1/attendance/employee/<id>/summary/`     | Per-employee summary + stats    |

**Query params for GET /attendance/**
- `?employee_id=EMP001`
- `?date=2025-03-04`
- `?status=Present`

**Mark attendance body:**
```json
{
  "employee_id": "EMP001",
  "date": "2025-03-04",
  "status": "Present"
}
```
> Posting for an (employee, date) that already exists will **update** the record (upsert).

---

### Other Endpoints

| Method | Endpoint               | Description               |
|--------|------------------------|---------------------------|
| GET    | `/api/v1/departments/` | List valid departments    |
| GET    | `/api/v1/dashboard/`   | Aggregated stats          |
| GET    | `/health/`             | Health check              |

---

## Deployment on Render (Free Tier)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Select your repo — Render will detect `render.yaml`
4. Set env vars: `SECRET_KEY`, `CORS_ALLOWED_ORIGINS` (your Vercel URL)
5. Deploy — migrations run automatically via `release` command in Procfile

After deploy, run seed data via Render Shell:
```bash
python manage.py seed_data
```

---

## Connecting the React Frontend

Replace the in-memory `HRMSDatabase` class in the frontend with real `fetch` calls:

```js
const API = "https://your-api.onrender.com/api/v1";

// Example: fetch employees
const res = await fetch(`${API}/employees/`);
const { data } = await res.json();

// Example: mark attendance
await fetch(`${API}/attendance/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ employee_id: "EMP001", date: "2025-03-04", status: "Present" }),
});
```

---

## Validations

- All fields required on create
- Valid email format enforced
- Duplicate `employee_id` → 409-style 400
- Duplicate `email` → 400
- Invalid department → 400
- Future attendance dates → 400
- Non-existent employee on attendance mark → 404
- All errors return structured JSON with `details` field

---

## Assumptions & Limitations

- Single admin user — no authentication layer (out of scope per assignment)
- SQLite used locally; PostgreSQL recommended for production
- `employee_id` is case-insensitive (stored/matched as uppercase)
- Attendance upserts on duplicate (employee, date) rather than rejecting
