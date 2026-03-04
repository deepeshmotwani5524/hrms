import { API_BASE } from "../constants/data";

const api = {
    async request(method, path, body = null) {
        const opts = {
            method,
            headers: { "Content-Type": "application/json" },
            };
            if (body) opts.body = JSON.stringify(body);

            let res;
            try {
                res = await fetch(`${API_BASE}${path}`, opts);
            } 
            catch (networkErr) {
                throw {
                    message:
                    "Cannot reach the server. Make sure the Django backend is running.",
                    details: null,
                };
            }

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
            // Django DRF error envelope: { success: false, message, details? }
            const msg =
                json.message ||
                json.detail ||
                `Request failed with status ${res.status}`;

            // Flatten DRF field-level errors into a single readable string
            let fieldErrors = null;
            if (json.details && typeof json.details === "object") {
                fieldErrors = Object.entries(json.details)
                .map(([field, errs]) => {
                    const text = Array.isArray(errs) ? errs.join(", ") : String(errs);
                    return `${field}: ${text}`;
                })
                .join("\n");
            }

            throw { message: fieldErrors || msg, details: json.details || null };
        }

        // Successful response — return the `data` field
        return json.data ?? json;
    },

    get: (path) => api.request("GET", path),
    post: (path, body) => api.request("POST", path, body),
    patch: (path, body) => api.request("PATCH", path, body),
    delete: (path) => api.request("DELETE", path),
};

// ─── API Helpers ──────────────────────────────────────────────────────────────
// These functions map between the Django field names (snake_case) and what the
// React components already expect, keeping all view code unchanged.

const employeeFromApi = (e) => ({
    // map Django field names → legacy React field names
    id: e.employee_id,
    name: e.full_name,
    email: e.email,
    department: e.department,
    createdAt: e.created_at,
    _pk: e.id, // internal DB primary key (kept for future use)
});

const attendanceFromApi = (r) => ({
    id: r.id,
    employeeId: r.employee_id,
    name: r.full_name,
    department: r.department,
    date: r.date,
    status: r.status,
});

// ─── All API calls used by the views ─────────────────────────────────────────
export const hrmsApi = {
    // Dashboard
    async getDashboard() {
        const data = await api.get("/dashboard/");
        // Reshape department_breakdown array → { dept: count } map
        const depts = {};
        (data.department_breakdown || []).forEach((d) => {
            depts[d.department] = d.count;
        });
        // Reshape present_counts array → { employee_id: days } map
        const presentCounts = {};
        (data.present_counts || []).forEach((p) => {
            presentCounts[p.employee__employee_id] = p.present_days;
        });
        return {
            totalEmployees: data.total_employees,
            presentToday: data.present_today,
            totalAttendance: data.total_attendance,
            depts,
            presentCounts,
        };
    },

    // Employees
    async getEmployees({ search = "", department = "" } = {}) {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (department) params.set("department", department);
        const qs = params.toString();
        const data = await api.get(`/employees/${qs ? "?" + qs : ""}`);
        return data.map(employeeFromApi);
    },

    async addEmployee({ id, name, email, department }) {
        const data = await api.post("/employees/", {
            employee_id: id,
            full_name: name,
            email,
            department,
        });
        return employeeFromApi(data);
    },

    async deleteEmployee(employeeId) {
        return api.delete(`/employees/${employeeId}/`);
    },

    // Attendance
    async getAttendance({ employeeId = "", date = "", status = "" } = {}) {
        const params = new URLSearchParams();
        if (employeeId) params.set("employee_id", employeeId);
        if (date) params.set("date", date);
        if (status) params.set("status", status);
        const qs = params.toString();
        const data = await api.get(`/attendance/${qs ? "?" + qs : ""}`);
        // API returns { records, total, present_days_map }
        const records = (data.records || data).map(attendanceFromApi);
        const presentDaysMap = data.present_days_map || {};
        return { records, presentDaysMap };
    },

    async markAttendance({ employeeId, date, status }) {
        const data = await api.post("/attendance/", {
            employee_id: employeeId,
            date,
            status,
        });
        return attendanceFromApi(data);
    },
};