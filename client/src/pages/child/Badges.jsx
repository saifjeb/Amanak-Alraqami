import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import ChildNav from "../../components/child/ChildNav.jsx";
import "./Badges.css";

const badgeCatalog = [
  { name: "password_protector", title_en: "Password Protector", title_ar: "حامي كلمة المرور", description_en: "Completed My Digital Secret adventure.", description_ar: "أكملت مغامرة سري الرقمي.", icon: "🔐", required_points: 50 },
  { name: "link_detective", title_en: "Link Detective", title_ar: "محقق الروابط", description_en: "Completed The Mystery Link adventure.", description_ar: "أكملت مغامرة الرابط الغامض.", icon: "🔗", required_points: 100 },
  { name: "stranger_spotter", title_en: "Stranger Spotter", title_ar: "مكتشف الغرباء", description_en: "Completed Who Is Behind the Screen adventure.", description_ar: "أكملت مغامرة من خلف الشاشة.", icon: "👤", required_points: 150 },
  { name: "kindness_hero", title_en: "Kindness Hero", title_ar: "بطل اللطف الرقمي", description_en: "Completed Be Kind Online adventure.", description_ar: "أكملت مغامرة كن لطيفاً على الإنترنت.", icon: "💚", required_points: 200 },
  { name: "privacy_guardian", title_en: "Privacy Guardian", title_ar: "حارس الخصوصية", description_en: "Completed Think Before You Share adventure.", description_ar: "أكملت مغامرة فكر قبل أن تشارك.", icon: "🛡️", required_points: 250 },
  { name: "smart_helper", title_en: "Smart Helper", title_ar: "طالب المساعدة الذكي", description_en: "Completed I Need Help adventure.", description_ar: "أكملت مغامرة أحتاج للمساعدة.", icon: "🤝", required_points: 300 },
  { name: "cyber_hero", title_en: "Cyber Hero", title_ar: "بطل الأمان الرقمي", description_en: "Completed all Amanak Alraqami adventures.", description_ar: "أكملت جميع مغامرات أمانك الرقمي.", icon: "🏆", required_points: 300 },
];

function getBadgeArray(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["badges", "earned_badges", "user_badges", "data"]) if (Array.isArray(data?.[key])) return data[key];
  return [];
}
function getBadgeName(item) { return item?.name || item?.badge_name || item?.badge?.name || ""; }

function Badges() {
  const navigate = useNavigate();
  const { isArabic, pick } = useLanguage();
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/badges/me")
      .then((response) => { if (active) setEarnedBadges(getBadgeArray(response.data)); })
      .catch((err) => { if (!active) return; if (err.response?.status === 401) { navigate("/child/login", { replace: true }); return; } setError(err.response?.data?.message || pick("تعذر تحميل شاراتك.", "Could not load your badges.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate, pick]);

  const earnedMap = useMemo(() => new Map(earnedBadges.map((badge) => [getBadgeName(badge), badge])), [earnedBadges]);
  const unlockedCount = badgeCatalog.filter((badge) => earnedMap.has(badge.name)).length;
  const percentage = Math.round((unlockedCount / badgeCatalog.length) * 100);

  if (loading) return <main className="badges-page" data-no-auto-translate="true"><ChildNav /><div className="badges-loading"><div className="badges-spinner" /><h2>{pick("جارٍ تحميل شاراتك...", "Loading your badges...")}</h2></div></main>;

  return (
    <main className="badges-page" data-no-auto-translate="true">
      <ChildNav />
      <div className="badges-container">
        <section className="badges-hero"><div><span className="badges-eyebrow">{pick("إنجازاتك", "YOUR ACHIEVEMENTS")}</span><h1>{pick("شارات الأمان الرقمي", "My Digital Safety Badges")}</h1><p>{pick("أكمل المغامرات، تعلّم عادات رقمية آمنة، واجمع كل الشارات.", "Complete adventures, learn safe digital habits, and collect every badge.")}</p></div><div className="badges-hero-icon">🏆</div></section>
        <section className="badge-progress-card"><div><span>{pick("مجموعة الشارات", "Badge Collection")}</span><strong>{pick(`${unlockedCount} من ${badgeCatalog.length} مفتوحة`, `${unlockedCount} of ${badgeCatalog.length} unlocked`)}</strong></div><strong className="badge-percent">{percentage}%</strong><div className="badge-progress-track"><div style={{ width: `${percentage}%` }} /></div></section>
        {error && <div className="badges-error" role="alert">⚠️ {error}</div>}
        <section className="badges-grid">
          {badgeCatalog.map((badge, index) => {
            const earned = earnedMap.get(badge.name);
            const unlocked = Boolean(earned);
            return <article key={badge.name} className={`badge-card badge-color-${(index % 6) + 1} ${unlocked ? "unlocked" : "locked"}`}>
              <div className="badge-status">{unlocked ? `✓ ${pick("مفتوحة", "Unlocked")}` : `🔒 ${pick("مقفلة", "Locked")}`}</div>
              <div className="badge-icon">{badge.icon}</div>
              <h2>{isArabic ? badge.title_ar : badge.title_en}</h2>
              <p>{isArabic ? badge.description_ar : badge.description_en}</p>
              <div className="badge-requirement">⭐ {badge.required_points} {pick("نقطة", "points")}</div>
              {unlocked && earned?.earned_at && <small>{pick("تم الحصول عليها", "Earned")} {new Date(earned.earned_at).toLocaleDateString(isArabic ? "ar-JO" : "en-US")}</small>}
            </article>;
          })}
        </section>
        {unlockedCount === badgeCatalog.length ? <section className="all-badges-complete"><span>🏆</span><div><strong>{pick("أنت بطل الأمان الرقمي!", "You are a Digital Safety Hero!")}</strong><p>{pick("عمل رائع — فتحت جميع الشارات.", "Amazing work — you unlocked every badge.")}</p></div></section> : <section className="badges-tip"><span>🚀</span><div><strong>{pick("واصل الاستكشاف!", "Keep Exploring!")}</strong><p>{pick("أكمل المزيد من المغامرات لفتح بقية الشارات.", "Complete more adventures to unlock the rest of your collection.")}</p></div><Link to="/child/adventures">{pick("تابع المغامرات", "Continue Adventures")}</Link></section>}
      </div>
    </main>
  );
}

export default Badges;
