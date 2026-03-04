import { useState } from "react";
import { Icon } from "../utility/icons";
import { Dashboard } from "./dashboard";
import { Employees } from "./employee";
import { Attendance } from "./attendance";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";

const PAGES = [
  { path: "/",           label: "Dashboard",  icon: "dashboard", title: "Dashboard",         subtitle: "Workforce overview",    component: Dashboard },
  { path: "/employees",  label: "Employees",  icon: "users",     title: "Employee Directory", subtitle: "Manage all records",    component: Employees },
  { path: "/attendance", label: "Attendance", icon: "calendar",  title: "Attendance",         subtitle: "Daily tracking",        component: Attendance },
];

// ─── Layout (rendered inside BrowserRouter, so hooks work) ───────────────────
export function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const today = new Date().toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" });

    // Find the active page config to drive the topbar title
    const activePage = PAGES.find(p => p.path === location.pathname) || PAGES[0];

    return (
        <div className="app">
            {sidebarOpen && <div className="sb-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* ── Sidebar ── */}
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
                {PAGES.map(p => (
                <NavLink
                    key={p.path}
                    to={p.path}
                    end={p.path === "/"}
                    className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                >
                    <Icon name={p.icon} size={16} /> {p.label}
                </NavLink>
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

            {/* ── Main ── */}
            <div className="main">
            <div className="topbar">
                <div className="topbar-l">
                <button className="menu-btn" onClick={() => setSidebarOpen(v => !v)}>
                    <Icon name="menu" size={20} />
                </button>
                <div>
                    <div className="page-title">{activePage.title}</div>
                    <div className="page-sub">{activePage.subtitle}</div>
                </div>
                </div>
                <div className="topbar-r">
                <span className="topbar-date">{today}</span>
                </div>
            </div>

            <div className="content">
                <Routes>
                {PAGES.map(p => (
                    <Route key={p.path} path={p.path} element={<p.component />} />
                ))}
                {/* Catch-all → redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            </div>

            {/* ── Mobile bottom nav ── */}
            <nav className="bottom-nav">
            {PAGES.map(p => (
                <NavLink
                key={p.path}
                to={p.path}
                end={p.path === "/"}
                className={({ isActive }) => `bnav-item${isActive ? " active" : ""}`}
                >
                <div className="bnav-ic"><Icon name={p.icon} size={20} /></div>
                {p.label}
                </NavLink>
            ))}
            </nav>
        </div>
    );
}