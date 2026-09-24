import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Award, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { api } from "../../api/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import heroesImage from "../../assets/amanak-heroes.webp";
import ChildNav from "../../components/child/ChildNav.jsx";
import { getAdventureFallbackCover } from "../../utils/adventureVisuals.js";
import "./ChildDashboard.css";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/, "");

function getMediaUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return Array.isArray(data?.data) ? data.data : [];
}

function ChildDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isArabic, pick } = useLanguage();
  const Arrow = isArabic ? ArrowLeft : ArrowRight;
  const [account, setAccount] = useState(user);
  const [adventures, setAdventures] = useState([]);
  const [progress, setProgress] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/auth/me"), api.get("/adventures"), api.get("/progress/me"), api.get("/badges/me")])
      .then(([accountResponse, adventuresResponse, progressResponse, badgesResponse]) => {
        if (!active) return;
        setAccount(accountResponse.data?.user || user);
        setAdventures(getArray(adventuresResponse.data, ["adventures"]));
        setProgress(getArray(progressResponse.data, ["progress", "progresses"]));
        setBadges(getArray(badgesResponse.data, ["badges", "earned_badges", "user_badges"]));
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) return navigate("/child/login", { replace: true });
        setError(err.response?.data?.message || pick("تعذر تحديث لوحة التحكم.", "Could not refresh your dashboard."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate, user, pick]);

  const activeAdventures = useMemo(() => adventures.filter((adventure) => adventure.is_active !== false), [adventures]);
  const activeIds = useMemo(() => new Set(activeAdventures.map((adventure) => Number(adventure.id))), [activeAdventures]);
  const completedCount = progress.filter((item) => item.completed === true && activeIds.has(Number(item.adventure_id))).length;
  const progressMap = useMemo(() => new Map(progress.map((item) => [Number(item.adventure_id), item])), [progress]);
  const featuredAdventures = activeAdventures.slice(0, 3);
  const currentUser = account || user;
  const olderGroup = String(currentUser?.age_group || "").includes("11");

  const progressPercent = activeAdventures.length ? Math.round((completedCount / activeAdventures.length) * 100) : 0;

  return (
    <main className={`child-dashboard-page ${olderGroup ? "teen-dashboard" : "young-dashboard"}`} data-no-auto-translate="true">
      <ChildNav />

      <div className="child-dashboard-shell">
        <section className="child-dashboard-hero">
          <div className="child-dashboard-hero-copy">
            <span className="child-dashboard-eyebrow"><Sparkles size={15} />{olderGroup ? pick("تحديات أقوى. قرارات أذكى.", "Sharper challenges. Smarter choices.") : pick("تعلّم. استكشف. كن آمناً.", "Explore. Learn. Stay safe.")}</span>
            <h1>{pick("مرحباً بعودتك،", "Welcome back,")} <span>{currentUser?.nickname || pick("مستكشف", "Explorer")}</span> 👋</h1>
            <p>{olderGroup ? pick("واجه سيناريوهات رقمية واقعية، اختبر قراراتك، وطوّر مهاراتك لتكون أكثر ثقة وأماناً.", "Take on realistic digital scenarios, test your choices, and level up your online safety skills.") : pick("اختر مغامرة قصيرة، تعلّم مهارة جديدة، واجمع النقاط والشارات في طريقك.", "Pick a short adventure, learn a new skill, and collect points and badges along the way.")}</p>
            <Link to="/child/adventures" className="child-dashboard-primary">{pick("تابع المغامرات", "Continue adventures")}<Arrow size={18} /></Link>
          </div>
          <div className="child-dashboard-hero-art">
            <img src={heroesImage} alt="Amanak heroes" />
            <div className="dashboard-level-card"><Award size={18} /><span>{pick("المستوى", "Level")}</span><strong>{currentUser?.current_level || pick("المستكشف", "Explorer")}</strong></div>
          </div>
        </section>

        {error && <div className="child-dashboard-error" role="alert">⚠️ {error}</div>}

        <section className="child-dashboard-overview" aria-label="Your progress">
          <article><span className="dashboard-stat-icon">⭐</span><div><small>{pick("النقاط", "Points")}</small><strong>{Number(currentUser?.total_points) || 0}</strong><span>{pick("استمر في التقدم", "Keep building your score")}</span></div></article>
          <article><span className="dashboard-stat-icon">🧭</span><div><small>{pick("المغامرات", "Adventures")}</small><strong>{loading ? "..." : `${completedCount} / ${activeAdventures.length}`}</strong><span>{progressPercent}% {pick("مكتمل", "complete")}</span></div></article>
          <article><span className="dashboard-stat-icon">🏅</span><div><small>{pick("الشارات", "Badges")}</small><strong>{loading ? "..." : badges.length}</strong><span>{pick("إنجازات تم فتحها", "achievements unlocked")}</span></div></article>
        </section>

        {featuredAdventures.length > 0 && (
          <section className="dashboard-adventure-preview">
            <div className="dashboard-section-heading">
              <div>
                <span>{pick("مغامراتك", "YOUR ADVENTURES")}</span>
                <h2>{pick("واصل رحلتك", "Keep your journey moving")}</h2>
              </div>
              <Link to="/child/adventures">{pick("عرض الكل", "View all")}<Arrow size={16} /></Link>
            </div>
            <div className="dashboard-adventure-cards">
              {featuredAdventures.map((adventure, index) => {
                const fallbackCover = getAdventureFallbackCover(adventure, index);
                const item = progressMap.get(Number(adventure.id));
                const completed = item?.completed === true;
                const started = Boolean(item);
                const title = (isArabic ? adventure.title_ar : adventure.title_en) || adventure.title_en || adventure.title_ar || pick("مغامرة", "Adventure");
                const imageUrl = getMediaUrl(adventure.image_url) || (adventure.image_media_id ? getMediaUrl(`/api/media/${adventure.image_media_id}`) : fallbackCover);
                return (
                  <Link key={adventure.id} to={`/child/adventures/${adventure.id}`} className="dashboard-adventure-card">
                    <img
                      src={imageUrl || fallbackCover}
                      alt={title}
                      loading="lazy"
                      onError={(event) => { if (event.currentTarget.src !== fallbackCover) event.currentTarget.src = fallbackCover; }}
                    />
                    <div>
                      <span>{completed ? `✓ ${pick("مكتملة", "Completed")}` : started ? pick("قيد التنفيذ", "In progress") : pick("ابدأ الآن", "Start now")}</span>
                      <h3>{title}</h3>
                      <small>⭐ {Number(adventure.completion_points) || 50} {pick("نقطة", "points")}</small>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="child-dashboard-grid">
          <article className="child-dashboard-panel continue-panel">
            <div className="panel-top"><div><span>{pick("خطوتك التالية", "YOUR NEXT STEP")}</span><h2>{completedCount === 0 ? pick("جاهز لأول مغامرة؟", "Ready for your first adventure?") : completedCount === activeAdventures.length && activeAdventures.length > 0 ? pick("رائع! أنهيت كل المغامرات", "Amazing — you completed every adventure!") : pick("جاهز للتحدي التالي؟", "Ready for the next challenge?")}</h2></div><Trophy size={28} /></div>
            <p>{pick("كل مغامرة تقدم موقفاً رقمياً قصيراً يساعدك على التفكير واتخاذ قرار أكثر أماناً.", "Each adventure gives you a short digital scenario that helps you think and make a safer choice.")}</p>
            <Link to="/child/adventures">{pick("عرض جميع المغامرات", "View all adventures")}<Arrow size={17} /></Link>
          </article>

          <article className="child-dashboard-panel assessment-panel">
            <span>{pick("اختبر مهاراتك", "CHECK YOUR SKILLS")}</span>
            <h2>{pick("تحدي الأمان الرقمي", "Digital Safety Challenge")}</h2>
            <p>{pick("قارن نتيجتك قبل وبعد المغامرات لتشاهد تطورك.", "Compare your score before and after the adventures to see your improvement.")}</p>
            <div className="assessment-actions"><Link to="/child/assessment/pre_test">🧠 {pick("الاختبار القبلي", "Pre-Test")}</Link><Link to="/child/assessment/post_test">🎯 {pick("الاختبار البعدي", "Post-Test")}</Link></div>
          </article>
        </section>

        <section className="dashboard-safety-tip"><ShieldCheck size={23} /><div><strong>{pick("تذكير أمان", "Safety reminder")}</strong><p>{pick("إذا جعلك شيء على الإنترنت غير مرتاح، توقف وأخبر شخصاً بالغاً تثق به.", "If something online makes you uncomfortable, stop and tell a trusted adult.")}</p></div></section>
      </div>
    </main>
  );
}

export default ChildDashboard;
