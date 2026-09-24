import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../api/api.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import ChildNav from "../../components/child/ChildNav.jsx";
import { getAdventureFallbackCover } from "../../utils/adventureVisuals.js";
import "./Adventures.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/api\/?$/, "");

function getMediaUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
}

const colorClasses = ["adventure-blue", "adventure-orange", "adventure-purple", "adventure-pink", "adventure-green", "adventure-yellow"];

function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) if (Array.isArray(data?.[key])) return data[key];
  return Array.isArray(data?.data) ? data.data : [];
}

function Adventures() {
  const navigate = useNavigate();
  const { isArabic, pick } = useLanguage();
  const [adventures, setAdventures] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/adventures"), api.get("/progress/me")])
      .then(([adventureResponse, progressResponse]) => {
        if (!active) return;
        setAdventures(getArray(adventureResponse.data, ["adventures"]));
        setProgress(getArray(progressResponse.data, ["progress", "progresses"]));
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) {
          navigate("/child/login", { replace: true });
          return;
        }
        setError(err.response?.data?.message || "We could not load your adventures. Please try again.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  const progressMap = useMemo(() => new Map(progress.map((item) => [Number(item.adventure_id), item])), [progress]);
  const activeAdventures = useMemo(() => adventures
    .filter((adventure) => adventure.is_active !== false)
    .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0)), [adventures]);
  const activeIds = new Set(activeAdventures.map((adventure) => Number(adventure.id)));
  const completedCount = progress.filter((item) => item.completed === true && activeIds.has(Number(item.adventure_id))).length;
  const completionPercent = activeAdventures.length ? Math.round((completedCount / activeAdventures.length) * 100) : 0;

  if (loading) {
    return <main className="adventures-page" data-no-auto-translate="true"><ChildNav /><div className="adventures-loader"><div className="adventures-spinner" /><h2>{pick("جارٍ تحميل مغامراتك...", "Loading your adventures...")}</h2><p>{pick("نجهز لك رحلة الأمان الرقمي.", "Preparing your digital safety journey.")}</p></div></main>;
  }

  return (
    <main className="adventures-page" data-no-auto-translate="true">
      <ChildNav />
      <section className="adventures-container">
        <section className="adventures-hero"><div><span className="adventure-eyebrow">{pick("استكشف • تعلم • كن آمناً", "EXPLORE • LEARN • STAY SAFE")}</span><h1>{pick("مغامراتك الرقمية", "Your Digital Adventures")}</h1><p className="adventures-arabic">{pick("اختر التحدي المناسب لعمرك وابدأ رحلتك", "Choose the challenge that fits your age and start your journey")}</p><p className="hero-description">{pick("أكمل المغامرات واجمع النقاط والشارات لتصبح بطلاً في الأمان الرقمي.", "Complete the adventures, collect points and badges, and become an Amanak Digital Safety Hero.")}</p></div><div className="hero-shield">🛡️</div></section>
        <section className="journey-progress"><div className="journey-progress-header"><div><span>{pick("رحلتك", "Your Journey")}</span><strong>{isArabic ? `${completedCount} من ${activeAdventures.length} مغامرات مكتملة` : `${completedCount} of ${activeAdventures.length} adventures completed`}</strong></div><strong className="journey-percent">{completionPercent}%</strong></div><div className="journey-progress-track"><div className="journey-progress-value" style={{ width: `${completionPercent}%` }} /></div></section>
        {error && <section className="adventures-error" role="alert"><span>⚠️</span><div><strong>{pick("حدث خطأ", "Something went wrong")}</strong><p>{error}</p></div><button type="button" onClick={() => window.location.reload()}>{pick("حاول مرة أخرى", "Try Again")}</button></section>}
        {!error && activeAdventures.length === 0 && <section className="no-adventures"><span>🧭</span><h2>{pick("لا توجد مغامرات متاحة", "No adventures available")}</h2><p>{pick("عد إلينا قريباً.", "Check back again soon.")}</p></section>}
        {!error && activeAdventures.length > 0 && <section className="adventure-grid">
          {activeAdventures.map((adventure, index) => {
            const item = progressMap.get(Number(adventure.id));
            const completed = item?.completed === true;
            const started = Boolean(item);
            const fallbackCover = getAdventureFallbackCover(adventure, index);
            const imageUrl =
              getMediaUrl(adventure.image_url) ||
              (adventure.image_media_id
                ? getMediaUrl(`/api/media/${adventure.image_media_id}`)
                : fallbackCover);
            return <article key={adventure.id} className={`adventure-card ${colorClasses[index % colorClasses.length]} ${completed ? "completed" : ""}`}>
              {completed && <div className="completed-badge">✓ {pick("مكتملة", "Completed")}</div>}
              <div className="adventure-card-number">{pick("المغامرة", "Adventure")} {adventure.display_order ?? index + 1}</div>
              <div className="adventure-cover">
                <img
                  src={imageUrl || fallbackCover}
                  alt={(isArabic ? adventure.title_ar : adventure.title_en) || adventure.title_en || adventure.title_ar || pick("مغامرة", "Adventure")}
                  loading="lazy"
                  onError={(event) => {
                    if (event.currentTarget.src !== fallbackCover) event.currentTarget.src = fallbackCover;
                  }}
                />
              </div>
              <div className="adventure-card-content"><h2>{(isArabic ? adventure.title_ar : adventure.title_en) || adventure.title_en || adventure.title_ar}</h2><p>{(isArabic ? adventure.description_ar : adventure.description_en) || adventure.description_en || adventure.description_ar || pick("مغامرتك الرقمية التالية بانتظارك.", "Your next digital safety story awaits.")}</p></div>
              <div className="adventure-reward"><span>⭐ {adventure.completion_points ?? 50} {pick("نقطة", "points")}</span>{adventure.badge_name && <span>🏅 {adventure.badge_name}</span>}</div>
              {started && <div className="adventure-mini-progress"><div><span>{pick("النتيجة", "Score")}</span><strong>{Number(item.score) || 0}%</strong></div><div><span>{pick("النقاط", "Points")}</span><strong>{Number(item.earned_points) || 0}</strong></div></div>}
              <Link to={`/child/adventures/${adventure.id}`} className="adventure-action">{completed ? pick("العب مرة أخرى", "Play Again") : started ? pick("تابع المغامرة", "Continue Adventure") : pick("ابدأ المغامرة", "Start Adventure")}<span>→</span></Link>
            </article>;
          })}
        </section>}
        <section className="adventure-safety-message"><div className="safety-message-icon">💡</div><div><strong>{pick("تذكّر", "Remember")}</strong><p>{pick("إذا جعلك شيء على الإنترنت غير مرتاح، توقف وأخبر شخصاً بالغاً تثق به.", "If something online makes you uncomfortable, stop and tell a trusted adult.")}</p></div></section>
      </section>
    </main>
  );
}

export default Adventures;