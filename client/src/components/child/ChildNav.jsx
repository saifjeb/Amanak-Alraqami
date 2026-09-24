import {
  Award,
  BrainCircuit,
  Compass,
  Home,
  Link2,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/amanak-logo.svg";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import LanguageToggle from "../common/LanguageToggle.jsx";
import AvatarPortrait from "../common/AvatarPortrait.jsx";
import "./ChildNav.css";

function ChildNav() {
  const navigate = useNavigate();
  const { user, childLogout } = useAuth();
  const { pick } = useLanguage();

  const items = [
    { to: "/child/dashboard", label: pick("لوحة التحكم", "Dashboard"), icon: Home },
    { to: "/child/adventures", label: pick("المغامرات", "Adventures"), icon: Compass },
    { to: "/child/badges", label: pick("إنجازاتي", "Achievements"), icon: Award },
    { to: "/child/assessment/pre_test", label: pick("التقييمات", "Assessments"), icon: BrainCircuit },
    { to: "/child/profile", label: pick("ملفي الشخصي", "My profile"), icon: UserRound },
    { to: "/child/link-parent", label: pick("ربط ولي الأمر", "Link parent"), icon: Link2 },
  ];

  async function logout() {
    try {
      await childLogout();
    } finally {
      navigate("/child/login", { replace: true });
    }
  }

  return (
    <>
      <aside className="child-side-nav" data-no-auto-translate="true">
        <NavLink to="/child/dashboard" className="child-side-brand">
          <img src={logo} alt="" />
          <span>
            <strong>{pick("أمانك الرقمي", "Amanak Alraqami")}</strong>
            <small>{pick("رحلتك الرقمية الآمنة", "Your safer digital journey")}</small>
          </span>
        </NavLink>

        <nav aria-label={pick("تنقل الطالب", "Student navigation")}>
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? "child-side-link active" : "child-side-link"
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="child-side-safety-card">
          <ShieldCheck size={28} />
          <strong>{pick("رحلتك مستمرة!", "Your journey continues!")}</strong>
          <p>
            {pick(
              "تعلم أكثر، جرّب مواقف جديدة، واطلب المساعدة عندما تحتاجها.",
              "Keep learning, try new situations, and ask for help when you need it.",
            )}
          </p>
        </div>
      </aside>

      <header className="child-topbar" data-no-auto-translate="true">
        <div className="child-topbar-greeting">
          <AvatarPortrait avatar={user?.avatar} size="sm" />
          <div>
            <strong>
              {pick("مرحباً", "Hello")}, {user?.nickname || pick("مستكشف", "Explorer")}!
            </strong>
            <small>
              {pick(
                "كل خطوة رقمية ذكية تجعلك أكثر أماناً.",
                "Every smart digital choice makes you safer.",
              )}
            </small>
          </div>
        </div>

        <div className="child-topbar-actions">
          <LanguageToggle compact />
          <span className="child-points-chip">⭐ {Number(user?.total_points) || 0}</span>
          <NavLink to="/child/profile" className="child-user-chip">
            <AvatarPortrait avatar={user?.avatar} size="sm" />
            <span>
              <strong>{user?.nickname || pick("مستكشف", "Explorer")}</strong>
              <small>{user?.age_group || ""}</small>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="child-logout-button"
            aria-label={pick("تسجيل الخروج", "Log out")}
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>
    </>
  );
}

export default ChildNav;
