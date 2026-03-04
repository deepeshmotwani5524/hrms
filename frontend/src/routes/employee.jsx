import { useState, useCallback, useEffect} from "react";
import { DEPARTMENTS } from "../constants/data";
import { Icon } from "../utility/icons";
import { avatarColor, getInitials } from "../utility/util";
import Alert from "../components/alert";
import Modal from "../components/modal";
import { hrmsApi } from "../utility/apis";
import { PageError } from "../components/pageError";

export function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({ id:"", name:"", email:"", department:"" });
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    // Server-side search & filter — re-fetches whenever filters change
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
        const data = await hrmsApi.getEmployees({ search, department: deptFilter });
        setEmployees(data);
        } catch (e) {
        setError(e.message || "Failed to load employees.");
        }
        setLoading(false);
    }, [search, deptFilter]);

    useEffect(() => {
        const t = setTimeout(() => load(), search ? 350 : 0); // debounce search
        return () => clearTimeout(t);
    }, [load, search]);

    const handleAdd = async () => {
        setFormError(""); setSaving(true);
        try {
        await hrmsApi.addEmployee(form);
        setShowAdd(false);
        setForm({ id:"", name:"", email:"", department:"" });
        setToast({ type:"success", msg:"Employee added successfully." });
        await load();
        } catch (e) { setFormError(e.message || "Failed to add employee."); }
        setSaving(false);
    };

    const handleDelete = async (employeeId) => {
        try {
        await hrmsApi.deleteEmployee(employeeId);
        setDeleting(null);
        setToast({ type:"success", msg:"Employee deleted." });
        await load();
        } catch (e) { setToast({ type:"error", msg: e.message }); }
    };

    return (
        <div>
        {toast && <Alert type={toast.type} onClose={() => setToast(null)}>{toast.msg}</Alert>}

        <div className="card">
            <div className="card-hd">
            <div className="frow" style={{ flex:1 }}>
                <div className="sw" style={{ flex:1, minWidth:0 }}>
                <span className="si"><Icon name="search" size={13} /></span>
                <input className="input" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ width:150 }}>
                <option value="">All Depts</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)} style={{ flexShrink:0 }}>
                <Icon name="plus" size={14} /> Add
            </button>
            </div>

            {loading ? (
            <div className="loading"><div className="spinner" /></div>
            ) : error ? (
            <PageError message={error} onRetry={load} />
            ) : (
            <>
                {/* Desktop table */}
                <div className="dt table-wrap">
                <table>
                    <thead><tr><th>Employee</th><th>Email</th><th>Department</th><th>Joined</th><th></th></tr></thead>
                    <tbody>
                    {employees.map(emp => (
                        <tr key={emp.id}>
                        <td><div className="ecell">
                            <div className="avatar" style={{ background:avatarColor(emp.name), color:"white" }}>{getInitials(emp.name)}</div>
                            <div><div className="ename">{emp.name}</div><div className="eid">{emp.id}</div></div>
                        </div></td>
                        <td style={{ color:"var(--ink-3)", fontSize:12 }}>{emp.email}</td>
                        <td><span className={`badge dept-${emp.department}`}>{emp.department}</span></td>
                        <td style={{ fontSize:12, color:"var(--ink-4)", fontFamily:"monospace" }}>{emp.createdAt}</td>
                        <td>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleting(emp)}>
                            <Icon name="trash" size={13} /> Delete
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>

                {/* Mobile cards */}
                <div className="mc">
                {employees.map(emp => (
                    <div key={emp.id} className="emp-card">
                    <div className="avatar" style={{ background:avatarColor(emp.name), color:"white" }}>{getInitials(emp.name)}</div>
                    <div className="emp-info">
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-meta">{emp.id} · {emp.email}</div>
                        <div style={{ marginTop:5 }}><span className={`badge dept-${emp.department}`}>{emp.department}</span></div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleting(emp)} style={{ padding:"8px", flexShrink:0 }}>
                        <Icon name="trash" size={15} />
                    </button>
                    </div>
                ))}
                </div>

                {employees.length === 0 && (
                <div className="empty">
                    <div className="empty-icon"><Icon name="users" size={20} /></div>
                    <div className="empty-title">{search || deptFilter ? "No employees match" : "No employees yet"}</div>
                    <div className="empty-text">Add your first employee to get started.</div>
                </div>
                )}
            </>
            )}
        </div>

        {/* Add modal */}
        {showAdd && (
            <Modal title="Add New Employee"
            onClose={() => { setShowAdd(false); setFormError(""); setForm({ id:"", name:"", email:"", department:"" }); }}
            footer={<>
                <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add Employee"}</button>
            </>}>
            {formError && <Alert type="error">{formError}</Alert>}
            <div className="form-grid">
                <div className="form-group">
                <label>Employee ID *</label>
                <input className="input" placeholder="e.g. EMP009" value={form.id} onChange={e => setForm(f => ({ ...f, id:e.target.value }))} />
                </div>
                <div className="form-group">
                <label>Department *</label>
                <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department:e.target.value }))}>
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
                </div>
                <div className="form-group full">
                <label>Full Name *</label>
                <input className="input" placeholder="e.g. Rahul Verma" value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))} />
                </div>
                <div className="form-group full">
                <label>Email Address *</label>
                <input className="input" type="email" inputMode="email" placeholder="rahul@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email:e.target.value }))} />
                </div>
            </div>
            </Modal>
        )}

        {/* Delete confirm */}
        {deleting && (
            <Modal title="Delete Employee" onClose={() => setDeleting(null)}
            footer={<>
                <button className="btn btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleting.id)}>Delete</button>
            </>}>
            <p style={{ fontSize:14, color:"var(--ink-2)", lineHeight:1.6 }}>
                Delete <strong>{deleting.name}</strong> ({deleting.id})?
                All attendance records will also be removed. This cannot be undone.
            </p>
            </Modal>
        )}
        </div>
    );
}