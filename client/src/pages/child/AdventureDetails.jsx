import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/api.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import ChildNav from "../../components/child/ChildNav.jsx";
import { getAdventureFallbackCover } from "../../utils/adventureVisuals.js";
import "./AdventureDetails.css";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/, "");
const getMediaUrl = (value) => !value ? null : /^https?:\/\//.test(value) ? value : `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
function AdventureDetails() {
  const { adventureId } = useParams();
  const navigate = useNavigate();
  const { isArabic, pick } = useLanguage();
  const [adventure, setAdventure] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const id = Number(adventureId);
  const invalidAdventureId = !Number.isInteger(id) || id <= 0;

  useEffect(() => {
    if (invalidAdventureId) return undefined;

    let active = true;

    Promise.all([api.get("/adventures"), api.get(`/questions/adventure/${id}`)])
      .then(([adventureResponse, questionResponse]) => {
        if (!active) return;
        const list = adventureResponse.data?.adventures || adventureResponse.data?.data || adventureResponse.data || [];
        const found = Array.isArray(list) ? list.find((item) => Number(item.id) === id) : null;
        if (!found) { setError(pick("المغامرة غير موجودة.", "Adventure not found.")); return; }
        setAdventure(found);
        setQuestionCount(Array.isArray(questionResponse.data?.questions) ? questionResponse.data.questions.length : 0);
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) return navigate("/child/login", { replace: true });
        setError(err.response?.status === 404 ? pick("المغامرة غير موجودة.", "Adventure not found.") : err.response?.data?.message || pick("تعذر تحميل هذه المغامرة.", "Could not load this adventure."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, invalidAdventureId, navigate, pick]);

  if (invalidAdventureId) {
    return (
      <main className="adventure-details-page" data-no-auto-translate="true">
        <ChildNav />
        <section className="adventure-details-error">
          <span>🧭</span>
          <h1>{pick("عذراً!", "Oops!")}</h1>
          <p>{pick("المغامرة غير موجودة.", "Adventure not found.")}</p>
          <Link to="/child/adventures">
            {pick("العودة إلى المغامرات", "Back to Adventures")}
          </Link>
        </section>
      </main>
    );
  }

  if (loading) return <main className="adventure-details-page" data-no-auto-translate="true"><ChildNav /><div className="adventure-details-loading"><div className="adventures-spinner" /><h2>{pick("نجهّز المغامرة...", "Preparing adventure...")}</h2></div></main>;
  if (error || !adventure) return <main className="adventure-details-page" data-no-auto-translate="true"><ChildNav /><section className="adventure-details-error"><span>🧭</span><h1>{pick("عذراً!", "Oops!")}</h1><p>{error}</p><Link to="/child/adventures">{pick("العودة إلى المغامرات", "Back to Adventures")}</Link></section></main>;

  const fallbackCover = getAdventureFallbackCover(adventure);
  const imageUrl = getMediaUrl(adventure.image_url) || (adventure.image_media_id ? getMediaUrl(`/api/media/${adventure.image_media_id}`) : fallbackCover);
  const title = (isArabic ? adventure.title_ar : adventure.title_en) || adventure.title_en || adventure.title_ar;
  const description = (isArabic ? adventure.description_ar : adventure.description_en) || adventure.description_en || adventure.description_ar;

  return (
    <main className="adventure-details-page" data-no-auto-translate="true"><ChildNav />
      <div className="adventure-details-container">
        <Link to="/child/adventures" className="details-back">{pick("جميع المغامرات →", "← All Adventures")}</Link>
        <section className="details-hero">
          <div className="details-icon details-cover">
            <img
              src={imageUrl || fallbackCover}
              alt={title}
              onError={(event) => {
                if (event.currentTarget.src !== fallbackCover) event.currentTarget.src = fallbackCover;
              }}
            />
          </div>
          <div className="details-content"><span className="details-label">{pick("المغامرة", "ADVENTURE")} {adventure.display_order}</span><h1>{title}</h1><p>{description}</p></div>
        </section>
        <section className="details-info-grid">
          <article><span>❓</span><strong>{questionCount}</strong><p>{pick("تحديات", "Challenges")}</p></article>
          <article><span>⭐</span><strong>{adventure.completion_points || 50}</strong><p>{pick("نقاط المغامرة", "Adventure Points")}</p></article>
          <article><span>🏅</span><strong>{pick("شارة", "Badge")}</strong><p>{adventure.badge_name || pick("بطل الأمان", "Safety Hero")}</p></article>
        </section>
        <section className="details-mission">
          <div><span>🎯</span><div><h3>{pick("مهمتك", "Your Mission")}</h3><p>{pick("اقرأ كل موقف بعناية، اختر الإجابة الأكثر أماناً، وتعلّم من التغذية الراجعة.", "Read each situation carefully, choose the safest answer, and learn from the feedback.")}</p></div></div>
          <div><span>💡</span><div><h3>{pick("تذكّر", "Remember")}</h3><p>{pick("يمكنك المحاولة مرة أخرى إذا أخطأت. الهدف هو التعلّم!", "You can try again if you make a mistake. Learning is the goal!")}</p></div></div>
        </section>
        {questionCount > 0 ? <Link to={`/child/adventures/${adventureId}/play`} className="start-adventure-button">🚀 {pick("ابدأ المغامرة", "Start Adventure")}</Link> : <button type="button" className="start-adventure-button disabled" disabled>{pick("لا توجد أسئلة متاحة", "No Questions Available")}</button>}
      </div>
    </main>
  );
}

export default AdventureDetails;
