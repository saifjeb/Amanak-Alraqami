import { Home, Link2, LogOut, ShieldCheck, UsersRound } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/amanak-logo.svg";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import LanguageToggle from "../common/LanguageToggle.jsx";
import "./ParentNav.css";

function ParentNav() {
  const navigate = useNavigate();
  const { user, parentLogout } = useAuth();
  const { pick } = useLanguage();

  async function logout() {
    try {
      await parentLogout();
    } finally {
      navigate("/parent/login", { replace: true });
    }
  }

  return (
    <>
      <aside className="parent-side-nav" data-no-auto-translate="true">
        <NavLink to="/parent/dashboard" className="parent-side-brand">
          <img src={logo} alt="" />
          <span>
            <strong>{pick("أمانك الرقمي", "Amanak Alraqami")}</strong>
            <small>{pick("مساحة ولي الأمر", "Parent space")}</small>
          </span>
        </NavLink>

        <nav aria-label={pick("تنقل ولي الأمر", "Parent navigation")}>
          <NavLink to="/parent/dashboard" end className={({ isActive }) => (isActive ? "active" : "")}>
            <Home size={18} />
            <span>{pick("نظرة عامة", "Overview")}</span>
          </NavLink>
          <NavLink to="/parent/dashboard#children">
            <UsersRound size={18} />
            <span>{pick("أطفالي", "My children")}</span>
          </NavLink>
          <NavLink to="/parent/dashboard#link">
            <Link2 size={18} />
            <span>{pick("ربط طفل", "Link child")}</span>
          </NavLink>
        </nav>

        <div className="parent-side-note">
          <ShieldCheck size={28} />
          <strong>{pick("الدعم يصنع فرقاً", "Support makes a difference")}</strong>
          <p>
            {pick(
              "تابع التقدم، ناقش ما يتعلمه طفلك، واحتفل بعاداته الرقمية الآمنة.",
              "Follow progress, talk about what they learn, and celebrate safer digital habits.",
            )}
          </p>
        </div>
      </aside>

      <header className="parent-topbar" data-no-auto-translate="true">
        <div className="parent-topbar-copy">
          <strong>{pick("مرحباً ولي الأمر", "Welcome, parent")}</strong>
          <small>
            {pick(
              "تابع رحلة أطفالك الرقمية من مكان واحد.",
              "Follow your children’s digital journey in one place.",
            )}
          </small>
        </div>

        <div className="parent-topbar-actions">
          <LanguageToggle compact />
          <div className="parent-account-copy">
            <strong>{user?.name || pick("ولي الأمر", "Parent")}</strong>
            <small>{user?.email || ""}</small>
          </div>
          <button type="button" onClick={logout} aria-label={pick("تسجيل الخروج", "Log out")}>
            <LogOut size={17} />
          </button>
        </div>
      </header>
    </>
  );
}

export default ParentNav;
