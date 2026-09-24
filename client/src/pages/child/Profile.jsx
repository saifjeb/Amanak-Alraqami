import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BrainCircuit,
  LockKeyhole,
  LogOut,
  Rocket,
  ShieldCheck,
  Star,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import ChildNav from "../../components/child/ChildNav.jsx";
import AvatarPortrait from "../../components/common/AvatarPortrait.jsx";
import "./Profile.css";

const avatarInfo = {
  avatar1: { en: "Explorer", ar: "المستكشف" },
  avatar2: { en: "Hero", ar: "البطل" },
  avatar3: { en: "Guardian", ar: "الحامي" },
  avatar4: { en: "Detective", ar: "المحقق" },
};

function Profile() {
  const navigate = useNavigate();
  const { user, childLogout } = useAuth();
  const { isArabic, pick } = useLanguage();

  const avatar = avatarInfo[user?.avatar] || avatarInfo.avatar1;
  const points = Number(user?.total_points) || 0;
  const level = user?.current_level || pick("المستكشف الرقمي", "Digital Explorer");
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  async function handleLogout() {
    try {
      await childLogout();
    } finally {
      navigate("/child/login", { replace: true });
    }
  }

  const journeyLinks = [
    {
      to: "/child/adventures",
      icon: Rocket,
      label: pick("المغامرات", "Adventures"),
      hint: pick("واصل رحلتك التعليمية", "Continue your learning journey"),
      tone: "blue",
    },
    {
      to: "/child/badges",
      icon: Award,
      label: pick("شاراتي", "My Badges"),
      hint: pick("شاهد إنجازاتك", "See your achievements"),
      tone: "green",
    },
    {
      to: "/child/assessment/pre_test",
      icon: BrainCircuit,
      label: pick("الاختبار القبلي", "Pre-Test"),
      hint: pick("اكتشف ما تعرفه الآن", "Check what you know now"),
      tone: "yellow",
    },
    {
      to: "/child/assessment/post_test",
      icon: ShieldCheck,
      label: pick("الاختبار البعدي", "Post-Test"),
      hint: pick("قِس تطور مهاراتك", "Measure your progress"),
      tone: "purple",
    },
  ];

  return (
    <main className="child-profile-page" data-no-auto-translate="true">
      <ChildNav />

      <div className="profile-container">
        <section className="profile-page-heading">
          <div>
            <span>{pick("ملفي الشخصي", "MY PROFILE")}</span>
            <h1>{pick("معلوماتي وإنجازاتي", "My details & achievements")}</h1>
            <p>
              {pick(
                "تابع هويتك الرقمية الآمنة وواصل رحلتك في أمانك الرقمي.",
                "See your Amanak identity, progress, and next learning steps.",
              )}
            </p>
          </div>
          <div className="profile-heading-icon" aria-hidden="true">
            <UserRound size={30} />
          </div>
        </section>

        <section className="profile-hero">
          <div className="profile-hero-person">
            <AvatarPortrait
              avatar={user?.avatar}
              size="xl"
              className="profile-avatar"
              alt={user?.nickname || pick("شخصيتي", "My avatar")}
            />
            <div className="profile-main-info">
              <span>{pick("بطل الأمان الرقمي", "DIGITAL SAFETY HERO")}</span>
              <h2>{user?.nickname || pick("مستكشف", "Explorer")}</h2>
              <p>{isArabic ? avatar.ar : avatar.en}</p>
            </div>
          </div>

          <div className="profile-hero-badge">
            <span className="profile-badge-icon">🛡️</span>
            <div>
              <small>{pick("مستواك الحالي", "CURRENT LEVEL")}</small>
              <strong>{level}</strong>
            </div>
          </div>
        </section>

        <section className="profile-stats" aria-label={pick("إحصائياتي", "My stats")}>
          <article>
            <span className="profile-stat-icon gold"><Star size={22} /></span>
            <strong>{points}</strong>
            <p>{pick("إجمالي النقاط", "Total Points")}</p>
          </article>
          <article>
            <span className="profile-stat-icon blue"><Award size={22} /></span>
            <strong>{level}</strong>
            <p>{pick("المستوى الحالي", "Current Level")}</p>
          </article>
          <article>
            <span className="profile-stat-icon purple">🎂</span>
            <strong>{user?.age_group || "—"}</strong>
            <p>{pick("الفئة العمرية", "Age Group")}</p>
          </article>
        </section>

        <section className="profile-main-grid">
          <div className="profile-left-stack">
            <article className="profile-panel journey-panel">
              <div className="profile-panel-heading">
                <span className="profile-panel-icon"><Rocket size={22} /></span>
                <div>
                  <h2>{pick("رحلتي", "My Journey")}</h2>
                  <p>{pick("واصل تعلم الأمان الرقمي", "Continue learning digital safety")}</p>
                </div>
              </div>

              <div className="profile-journey-links">
                {journeyLinks.map(({ to, icon: Icon, label, hint, tone }) => (
                  <Link key={to} to={to} className={`profile-journey-link ${tone}`}>
                    <span className="profile-journey-icon"><Icon size={19} /></span>
                    <span className="profile-journey-copy">
                      <strong>{label}</strong>
                      <small>{hint}</small>
                    </span>
                    <Arrow size={18} />
                  </Link>
                ))}
              </div>
            </article>

            <Link to="/child/link-parent" className="profile-family-card">
              <div className="profile-family-icon"><UsersRound size={28} /></div>
              <div>
                <span>{pick("العائلة والأمان", "FAMILY & SAFETY")}</span>
                <h2>{pick("اربط حسابك بولي الأمر", "Connect with a parent")}</h2>
                <p>
                  {pick(
                    "اسمح لولي أمرك بمتابعة تقدمك ودعم رحلتك الرقمية الآمنة.",
                    "Let your parent follow your progress and support your safer digital journey.",
                  )}
                </p>
              </div>
              <span className="profile-family-arrow"><Arrow size={20} /></span>
            </Link>
          </div>

          <article className="profile-panel profile-details-panel">
            <div className="profile-panel-heading">
              <span className="profile-panel-icon"><UserRound size={22} /></span>
              <div>
                <h2>{pick("بياناتي", "My Profile")}</h2>
                <p>{pick("تفاصيل حسابك في أمانك", "Your Amanak account details")}</p>
              </div>
            </div>

            <div className="profile-details">
              <div>
                <span>{pick("الاسم المستعار", "Nickname")}</span>
                <strong>{user?.nickname || "—"}</strong>
              </div>
              <div>
                <span>{pick("الفئة العمرية", "Age Group")}</span>
                <strong>{user?.age_group || "—"}</strong>
              </div>
              <div>
                <span>{pick("الشخصية", "Avatar")}</span>
                <strong>{isArabic ? avatar.ar : avatar.en}</strong>
              </div>
              <div>
                <span>{pick("مستوى الأمان", "Safety Level")}</span>
                <strong>{level}</strong>
              </div>
            </div>

            <div className="profile-account-note">
              <LockKeyhole size={18} />
              <p>
                {pick(
                  "حساب الطفل لا يحتاج إلى بريد إلكتروني. احتفظ بكلمة المرور لنفسك فقط.",
                  "Your child account does not need an email address. Keep your password private.",
                )}
              </p>
            </div>
          </article>
        </section>

        <section className="profile-safety-card">
          <span><ShieldCheck size={24} /></span>
          <div>
            <strong>{pick("خصوصيتك مهمة", "Your privacy matters")}</strong>
            <p>
              {pick(
                "يحتاج أمانك فقط إلى اسمك المستعار وفئتك العمرية وشخصيتك. لا تشارك معلوماتك الخاصة مع الغرباء على الإنترنت.",
                "Amanak only needs your nickname, age group and avatar. Never share private information with strangers online.",
              )}
            </p>
          </div>
        </section>

        <section className="profile-logout-section">
          <button type="button" onClick={handleLogout}>
            <LogOut size={17} />
            {pick("تسجيل الخروج", "Logout")}
          </button>
        </section>
      </div>
    </main>
  );
}

export default Profile;
