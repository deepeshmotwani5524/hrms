import { useState, useCallback, useEffect} from "react";
import { Icon } from "../utility/icons";
import { avatarColor, getInitials } from "../utility/util";
import Alert from "../components/alert";
import Modal from "../components/modal";
import { hrmsApi } from "../utility/apis";
import { PageError } from "../components/pageError";

export function Attendance() {
    const [employees, setEmployees] = useState([]);
    const [records, setRecords] = useState([]);
    const [presentDaysMap, setPresentDaysMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [empFilter, setEmpFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [showMark, setShowMark] = useState(false);
    const [form, setForm] = useState({ employeeId:"", date:new Date().toISOString().split("T")[0], status:"Present" });
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
        const [emps, attData] = await Promise.all([
            hrmsApi.getEmployees(),
            hrmsApi.getAttendance({ employeeId:empFilter, date:dateFilter }),
        ]);
        setEmployees(emps);
        setRecords(attData.records);
        setPresentDaysMap(attData.presentDaysMap);
        } catch (e) {
        setError(e.message || "Failed to load attendance.");
        }
        setLoading(false);
    }, [empFilter, dateFilter]);

    useEffect(() => { load(); }, [load]);

    const handleMark = async () => {
        setFormError(""); setSaving(true);
        try {
        await hrmsApi.markAttendance(form);
        setShowMark(false);
        setForm({ employeeId:"", date:new Date().toISOString().split("T")[0], status:"Present" });
        setToast({ type:"success", msg:"Attendance marked!" });
        await load();
        } catch (e) { setFormError(e.message || "Failed."); }
        setSaving(false);
    };

    const presentCount = records.filter(r => r.status === "Present").length;

    return (
        <div>
        {toast && <Alert type={toast.type} onClose={() => setToast(null)}>{toast.msg}</Alert>}

        <div className="mini-stats">
            {[
            { label:"Records", value:records.length, cls:"" },
            { label:"Present",  value:presentCount, cls:"green" },
            { label:"Absent",   value:records.length - presentCount, cls:"" },
            ].map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
                <div className="stat-lbl">{s.label}</div>
                <div className="stat-val" style={{ fontSize:22 }}>{s.value}</div>
            </div>
            ))}
        </div>

        <div className="card">
            <div className="card-hd">
            <div className="frow" style={{ flex:1 }}>
                <select className="select" value={empFilter} onChange={e => setEmpFilter(e.target.value)} style={{ flex:1, minWidth:0 }}>
                <option value="">All Employees</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <input className="input" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ width:150 }} />
                {(empFilter || dateFilter) && (
                <button className="btn btn-secondary btn-sm" onClick={() => { setEmpFilter(""); setDateFilter(""); }}>
                    <Icon name="x" size={12} />
                </button>
                )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowMark(true)} style={{ flexShrink:0 }}>
                <Icon name="plus" size={14} /> Mark
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
                    <thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Status</th><th>Total Present</th></tr></thead>
                    <tbody>
                    {records.map(r => {
                        // present_days_map is keyed by employee_id from the API
                        const tp = presentDaysMap[r.employeeId] ?? 0;
                        return (
                        <tr key={r.id}>
                            <td><div className="ecell">
                            <div className="avatar" style={{ background:avatarColor(r.name), color:"white" }}>{getInitials(r.name)}</div>
                            <div><div className="ename">{r.name}</div><div className="eid">{r.employeeId}</div></div>
                            </div></td>
                            <td><span className={`badge dept-${r.department}`}>{r.department}</span></td>
                            <td style={{ fontFamily:"monospace", fontSize:12 }}>{r.date}</td>
                            <td><span className={`badge ${r.status==="Present"?"badge-green":"badge-red"}`}>{r.status}</span></td>
                            <td><span className="badge badge-blue">{tp} days</span></td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>

                {/* Mobile cards */}
                <div className="mc">
                {records.map(r => {
                    const tp = presentDaysMap[r.employeeId] ?? 0;
                    return (
                    <div key={r.id} className="att-card">
                        <div className="att-row">
                        <div className="avatar" style={{ background:avatarColor(r.name), color:"white", width:36, height:36 }}>{getInitials(r.name)}</div>
                        <div className="att-info">
                            <div className="att-name">{r.name} <span className="eid">· {r.employeeId}</span></div>
                            <div className="att-meta">
                            <span className={`badge dept-${r.department}`}>{r.department}</span>
                            <span style={{ fontFamily:"monospace", fontSize:11 }}>{r.date}</span>
                            <span className={`badge ${r.status==="Present"?"badge-green":"badge-red"}`}>{r.status}</span>
                            <span className="badge badge-blue">{tp}d present</span>
                            </div>
                        </div>
                        </div>
                    </div>
                    );
                })}
                </div>

                {records.length === 0 && (
                <div className="empty">
                    <div className="empty-icon"><Icon name="calendar" size={20} /></div>
                    <div className="empty-title">No records found</div>
                    <div className="empty-text">Adjust filters or mark attendance.</div>
                </div>
                )}
            </>
            )}
        </div>

        {showMark && (
            <Modal title="Mark Attendance" onClose={() => { setShowMark(false); setFormError(""); }}
            footer={<>
                <button className="btn btn-secondary" onClick={() => setShowMark(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleMark} disabled={saving}>{saving ? "Saving…" : "Mark Attendance"}</button>
            </>}>
            {formError && <Alert type="error">{formError}</Alert>}
            <div className="form-grid">
                <div className="form-group full">
                <label>Employee *</label>
                <select className="select" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId:e.target.value }))}>
                    <option value="">Select employee…</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                </select>
                </div>
                <div className="form-group">
                <label>Date *</label>
                <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date:e.target.value }))} />
                </div>
                <div className="form-group">
                <label>Status *</label>
                <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status:e.target.value }))}>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                </select>
                </div>
            </div>
            <p style={{ fontSize:12, color:"var(--ink-4)", marginTop:10, lineHeight:1.5 }}>
                Existing records for this employee + date will be updated.
            </p>
            </Modal>
        )}
        </div>
    );
}