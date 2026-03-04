import { useState, useEffect, useCallback} from "react";
import { Icon } from "../utility/icons";
import { avatarColor, getInitials } from "../utility/util";
import { hrmsApi } from "../utility/apis";
import { PageError } from "../components/pageError";

export function Dashboard({ onNavigate }) {
    const [data, setData] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [recentAtt, setRecentAtt] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
        const [dash, emps, attData] = await Promise.all([
            hrmsApi.getDashboard(),
            hrmsApi.getEmployees(),
            hrmsApi.getAttendance(),
        ]);
        setData(dash);
        setEmployees(emps);
        setRecentAtt(attData.records.slice(0, 6));
        } catch (e) {
        setError(e.message || "Unknown error");
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <div className="loading"><div className="spinner" /></div>;
    if (error) return <PageError message={error} onRetry={load} />;
    if (!data) return null;

    const maxDept = Math.max(...Object.values(data.depts), 1);
    const totalPresent = Object.values(data.presentCounts).reduce((a, b) => a + b, 0);
    const presentRate = data.totalAttendance > 0 ? Math.round((totalPresent / data.totalAttendance) * 100) : 0;
    const circ = 2 * Math.PI * 27;
    const dashOff = circ - (presentRate / 100) * circ;

    return (
        <div>
        <div className="stats-grid">
            {[
            { label:"Total Employees", value:data.totalEmployees, sub:"Active records", cls:"" },
            { label:"Present Today",   value:data.presentToday,   sub:`of ${data.totalEmployees}`, cls:"green" },
            { label:"Departments",     value:Object.keys(data.depts).length, sub:"Across org", cls:"purple" },
            { label:"Attendance Logs", value:data.totalAttendance, sub:"Total entries", cls:"orange" },
            ].map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
                <div className="stat-lbl">{s.label}</div>
                <div className="stat-val">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
            </div>
            ))}
        </div>

        <div className="two-col">
            <div className="card">
            <div className="card-hd"><span className="card-title">By Department</span></div>
            <div className="card-body">
                <div className="dept-bars">
                {Object.entries(data.depts).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                    <div key={dept} className="dbar-row">
                    <span className="dbar-lbl">{dept}</span>
                    <div className="dbar-track"><div className="dbar-fill" style={{ width:`${(count/maxDept)*100}%` }} /></div>
                    <span className="dbar-cnt">{count}</span>
                    </div>
                ))}
                </div>
            </div>
            </div>

            <div className="card">
            <div className="card-hd"><span className="card-title">Attendance Overview</span></div>
            <div className="card-body">
                <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:20 }}>
                <div className="ring">
                    <svg width="76" height="76" viewBox="0 0 76 76">
                    <circle cx="38" cy="38" r="27" fill="none" stroke="var(--surface-2)" strokeWidth="7" />
                    <circle cx="38" cy="38" r="27" fill="none" stroke="var(--success)" strokeWidth="7"
                        strokeDasharray={circ} strokeDashoffset={dashOff} strokeLinecap="round"
                        style={{ transition:"stroke-dashoffset 1s ease" }} />
                    </svg>
                    <div className="ring-lbl">
                    <span className="ring-pct">{presentRate}%</span>
                    <span className="ring-sub">present</span>
                    </div>
                </div>
                <div style={{ flex:1 }}>
                    {[["Total", data.totalAttendance, "var(--ink-2)"],
                    ["Present", totalPresent, "var(--success)"],
                    ["Absent", data.totalAttendance - totalPresent, "var(--danger)"]].map(([l,v,c]) => (
                    <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:13, color:c }}>● {l}</span>
                        <strong style={{ fontSize:13 }}>{v}</strong>
                    </div>
                    ))}
                </div>
                </div>
                <div style={{ borderTop:"1px solid var(--border)", paddingTop:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink-3)", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                    Top Attendees
                </div>
                {Object.entries(data.presentCounts).sort((a,b) => b[1]-a[1]).slice(0,3).map(([eid, count]) => {
                    const emp = employees.find(e => e.id === eid);
                    if (!emp) return null;
                    return (
                    <div key={eid} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8 }}>
                        <div className="avatar" style={{ width:28, height:28, fontSize:11, background:avatarColor(emp.name), color:"white" }}>{getInitials(emp.name)}</div>
                        <span style={{ fontSize:13, flex:1 }}>{emp.name}</span>
                        <span className="badge badge-green">{count}d</span>
                    </div>
                    );
                })}
                </div>
            </div>
            </div>
        </div>

        <div className="card">
            <div className="card-hd">
            <span className="card-title">Recent Attendance</span>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("attendance")}>View All</button>
            </div>
            {/* Desktop */}
            <div className="dt table-wrap">
            <table>
                <thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                {recentAtt.map(r => (
                    <tr key={r.id}>
                    <td><div className="ecell">
                        <div className="avatar" style={{ background:avatarColor(r.name), color:"white" }}>{getInitials(r.name)}</div>
                        <div><div className="ename">{r.name}</div><div className="eid">{r.employeeId}</div></div>
                    </div></td>
                    <td><span className={`badge dept-${r.department}`}>{r.department}</span></td>
                    <td style={{ fontFamily:"monospace", fontSize:12 }}>{r.date}</td>
                    <td><span className={`badge ${r.status==="Present"?"badge-green":"badge-red"}`}>{r.status}</span></td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            {/* Mobile */}
            <div className="mc">
            {recentAtt.map(r => (
                <div key={r.id} className="att-card">
                <div className="att-row">
                    <div className="avatar" style={{ background:avatarColor(r.name), color:"white", width:36, height:36 }}>{getInitials(r.name)}</div>
                    <div className="att-info">
                    <div className="att-name">{r.name}</div>
                    <div className="att-meta">
                        <span className={`badge dept-${r.department}`}>{r.department}</span>
                        <span style={{ fontFamily:"monospace", fontSize:11 }}>{r.date}</span>
                        <span className={`badge ${r.status==="Present"?"badge-green":"badge-red"}`}>{r.status}</span>
                    </div>
                    </div>
                </div>
                </div>
            ))}
            {recentAtt.length === 0 && (
                <div className="empty">
                <div className="empty-icon"><Icon name="calendar" size={20} /></div>
                <div className="empty-title">No records yet</div>
                </div>
            )}
            </div>
        </div>
        </div>
    );
}