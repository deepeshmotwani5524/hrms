import { useState } from "react";
import { Icon } from "./utility/icons";
import { Dashboard } from "./routes/dashboard";
import { Employees } from "./routes/employee";
import { Attendance } from "./routes/attendance";
import "./App.css";

const PAGES = {
    dashboard: { label: "Dashboard", icon: "dashboard", title: "Dashboard", subtitle: "Overview of your workforce" },
    employees: { label: "Employees", icon: "users", title: "Employee Directory", subtitle: "Manage all employee records" },
    attendance: { label: "Attendance", icon: "calendar", title: "Attendance Management", subtitle: "Track and manage daily attendance" },
};

function App() {
    const [page, setPage] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const today = new Date().toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" });
    const navigate = p => { setPage(p); setSidebarOpen(false); };

    return (
        <div className="app">
            {sidebarOpen && <div className="sb-overlay" onClick={() => setSidebarOpen(false)} />}

            <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sb-brand">
                <div className="brand-logo">
                <div className="brand-icon"><Icon name="star" size={17} /></div>
                <div>
                    <div className="brand-name">HRMS Lite</div>
                    <div className="brand-sub">Admin Panel</div>
                </div>
                </div>
            </div>
            <nav className="sb-nav">
                <div className="nav-lbl">Menu</div>
                {Object.entries(PAGES).map(([key, p]) => (
                <button key={key} className={`nav-item ${page===key?"active":""}`} onClick={() => navigate(key)}>
                    <Icon name={p.icon} size={16} /> {p.label}
                </button>
                ))}
            </nav>
            <div className="sb-footer">
                <div className="admin-badge">
                <div className="admin-av">AD</div>
                <div>
                    <div style={{ fontWeight:600, color:"rgba(255,255,255,.7)", fontSize:13 }}>Admin</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>hr@company.com</div>
                </div>
                </div>
            </div>
            </aside>

            <div className="main">
                <div className="topbar">
                    <div className="topbar-l">
                    <button className="menu-btn" onClick={() => setSidebarOpen(v => !v)}><Icon name="menu" size={20} /></button>
                    <div>
                        <div className="page-title">{PAGES[page].title}</div>
                        <div className="page-sub">{PAGES[page].subtitle}</div>
                    </div>
                    </div>
                    <div className="topbar-r">
                    <span className="topbar-date">{today}</span>
                    </div>
                </div>
                <div className="content">
                    {page === "dashboard"  && <Dashboard onNavigate={setPage} />}
                    {page === "employees"  && <Employees />}
                    {page === "attendance" && <Attendance />}
                </div>
            </div>

            <nav className="bottom-nav">
            {Object.entries(PAGES).map(([key, p]) => (
                <button key={key} className={`bnav-item ${page===key?"active":""}`} onClick={() => setPage(key)}>
                <div className="bnav-ic"><Icon name={p.icon} size={20} /></div>
                {p.label}
                </button>
            ))}
            </nav>
        </div>
    );
}

export default App;
