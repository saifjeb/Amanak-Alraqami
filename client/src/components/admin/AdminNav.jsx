import {
  BarChart3,
  BookOpenCheck,
  FileQuestion,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/amanak-logo.svg";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import LanguageToggle from "../common/LanguageToggle.jsx";
import "./AdminNav.css";

function AdminNav() {
  const navigate = useNavigate();
  const { user, adminLogout } = useAuth();
  const { pick } = useLanguage();

  const workspaceItems = [
    {
      to: "/admin/dashboard",
      label: pick("لوحة التحكم", "Dashboard"),
      icon: LayoutDashboard,
    },
    {
      to: "/admin/students",
      label: pick("إدارة الطلبة", "Student Management"),
      icon: UsersRound,
    },
  ];

  const contentItems = [
    {
      to: "/admin/adventures",
      label: pick("إدارة المغامرات", "Adventure Management"),
      icon: BookOpenCheck,
    },
    {
      to: "/admin/questions",
      label: pick("إدارة الأسئلة", "Question Management"),
      icon: FileQuestion,
    },
    {
      to: "/admin/media",
      label: pick("إدارة الوسائط", "Media Management"),
      icon: Image,
    },
  ];

  async function logout() {
    try {
      await adminLogout();
    } finally {
      navigate("/admin/login", { replace: true });
    }
  }

  function renderLinks(items) {
    return items.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          isActive ? "admin-side-link active" : "admin-side-link"
        }
      >
        <Icon size={20} strokeWidth={2.1} />
        <span>{label}</span>
      </NavLink>
    ));
  }

  return (
    <>
      <aside className="admin-sidebar" data-no-auto-translate="true">
        <Link to="/admin/dashboard" className="admin-sidebar-brand">
          <img src={logo} alt="" />
          <span>
            <strong>{pick("أمانك الرقمي", "Amanak Alraqami")}</strong>
            <small>{pick("منصة الإدارة", "Admin Platform")}</small>
          </span>
        </Link>

        <div className="admin-sidebar-scroll">
          <section className="admin-side-section">
            <span className="admin-side-label">
              {pick("مساحة العمل", "MY WORKSPACE")}
            </span>
            <nav aria-label={pick("مساحة عمل الإدارة", "Admin workspace")}> 
              {renderLinks(workspaceItems)}
            </nav>
          </section>

          <section className="admin-side-section">
            <span className="admin-side-label">
              {pick("إدارة المحتوى", "CONTENT MANAGEMENT")}
            </span>
            <nav aria-label={pick("إدارة المحتوى", "Content management")}> 
              {renderLinks(contentItems)}
            </nav>
          </section>

          <section className="admin-side-section">
            <span className="admin-side-label">
              {pick("الإدارة", "ADMINISTRATION")}
            </span>

            <nav aria-label={pick("أدوات الإدارة", "Administration tools")}>
              <NavLink
                to="/admin/analytics"
                className={({ isActive }) =>
                  isActive ? "admin-side-link active" : "admin-side-link"
                }
              >
                <BarChart3 size={20} strokeWidth={2.1} />
                <span>{pick("التحليلات", "Analytics")}</span>
              </NavLink>

              <NavLink
                to="/admin/security"
                className={({ isActive }) =>
                  isActive ? "admin-side-link active" : "admin-side-link"
                }
              >
                <ShieldCheck size={20} strokeWidth={2.1} />
                <span>{pick("الأمان والتدقيق", "Security / Audit")}</span>
              </NavLink>

              <NavLink
                to="/admin/settings"
                className={({ isActive }) =>
                  isActive ? "admin-side-link active" : "admin-side-link"
                }
              >
                <Settings size={20} strokeWidth={2.1} />
                <span>{pick("الإعدادات", "Settings")}</span>
              </NavLink>
            </nav>
          </section>
        </div>
      </aside>

      <header className="admin-topbar" data-no-auto-translate="true">
        <div className="admin-topbar-user">
          <strong>{user?.name || pick("مدير النظام", "Administrator")}</strong>
          <span>{user?.email || pick("حساب الإدارة", "Admin account")}</span>
        </div>

        <div className="admin-topbar-actions">
          <span className="admin-role-badge">ADMIN</span>

          <LanguageToggle compact />

          <Link
            to="/"
            className="admin-topbar-icon"
            aria-label={pick("الرئيسية", "Home")}
            title={pick("الرئيسية", "Home")}
          >
            <Home size={20} />
          </Link>

          <button type="button" className="admin-topbar-logout" onClick={logout}>
            <LogOut size={19} />
            <span>{pick("تسجيل الخروج", "Logout")}</span>
          </button>
        </div>
      </header>
    </>
  );
}

export default AdminNav;
