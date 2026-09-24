import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/api.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import ParentNav from "../../components/parent/ParentNav.jsx";
import AvatarPortrait from "../../components/common/AvatarPortrait.jsx";
import "./ChildProgress.css";


function ChildProgress() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { isArabic, pick } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const id = Number(childId);
  const invalidChildId = !Number.isInteger(id) || id <= 0;

  useEffect(() => {
    if (invalidChildId) return undefined;

    let active = true;

    api.get(`/parent/children/${id}/dashboard`)
      .then((response) => { if (active) setDashboard(response.data?.dashboard || null); })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) navigate("/parent/login", { replace: true });
        else setError(err.response?.status === 404 ? pick("الطفل المرتبط غير موجود.", "Linked child not found.") : err.response?.data?.message || pick("تعذر تحميل تقدم الطفل.", "Could not load child progress."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, invalidChildId, navigate, pick]);

  const completedCount = useMemo(() => dashboard?.progress?.filter((item) => item.completed === true).length || 0, [dashboard]);
  const progressPercent = dashboard?.progress?.length ? Math.round((completedCount / dashboard.progress.length) * 100) : 0;

  if (invalidChildId) {
    return (
      <main className="child-progress-page" data-no-auto-translate="true">
        <ParentNav />
        <div className="child-progress-state">
          <span>⚠️</span>
          <h2>{pick("الطفل المرتبط غير موجود.", "Linked child not found.")}</h2>
          <Link to="/parent/dashboard">
            {pick("العودة إلى لوحة ولي الأمر", "Back to Parent Dashboard")}
          </Link>
        </div>
      </main>
    );
  }

  if (loading) return <main className="child-progress-page" data-no-auto-translate="true"><ParentNav /><div className="child-progress-state"><div className="child-progress-spinner" /><h2>{pick("جارٍ تحميل التقدم...", "Loading progress...")}</h2></div></main>;
  if (error || !dashboard) return <main className="child-progress-page" data-no-auto-translate="true"><ParentNav /><div className="child-progress-state"><span>⚠️</span><h2>{error || pick("التقدم غير متاح", "Progress unavailable")}</h2><Link to="/parent/dashboard">{pick("العودة إلى لوحة ولي الأمر", "Back to Parent Dashboard")}</Link></div></main>;

  const { child, progress, badges, assessment } = dashboard;

  return (
    <main className="child-progress-page" data-no-auto-translate="true"><ParentNav />
      <div className="child-progress-container">
        <Link to="/parent/dashboard" className="child-progress-back">{pick("لوحة ولي الأمر →", "← Parent Dashboard")}</Link>
        <section className="child-progress-hero"><AvatarPortrait avatar={child.avatar} size="xl" className="child-progress-avatar" /><div><span>{pick("رحلة الأمان الرقمي", "DIGITAL SAFETY JOURNEY")}</span><h1>{child.nickname}</h1><p>{pick("الفئة العمرية:", "Age group:")} {child.age_group}</p></div></section>
        <section className="child-progress-summary"><article><span>⭐</span><strong>{Number(child.total_points) || 0}</strong><p>{pick("إجمالي النقاط", "Total Points")}</p></article><article><span>🏆</span><strong>{child.current_level || pick("المستكشف", "Explorer")}</strong><p>{pick("المستوى الحالي", "Current Level")}</p></article><article><span>🧭</span><strong>{completedCount}/{progress.length}</strong><p>{pick("المغامرات", "Adventures")}</p></article><article><span>🏅</span><strong>{badges.length}</strong><p>{pick("الشارات المكتسبة", "Badges Earned")}</p></article></section>
        <section className="parent-learning-progress"><div className="parent-learning-heading"><div><span>{pick("رحلة التعلم", "LEARNING JOURNEY")}</span><h2>{pick("تقدم المغامرات", "Adventure Progress")}</h2></div><strong>{progressPercent}%</strong></div><div className="parent-learning-track"><div style={{ width: `${progressPercent}%` }} /></div></section>
        <section className="parent-adventure-grid">{progress.map((adventure) => <article key={adventure.adventure_id} className={`parent-adventure ${adventure.completed ? "completed" : ""}`}><div className="parent-adventure-icon">{adventure.completed ? "✅" : "🧭"}</div><span>{pick("المغامرة", "Adventure")} {adventure.display_order}</span><h3>{(isArabic ? adventure.title_ar : adventure.title_en) || adventure.title_en || adventure.title_ar}</h3><div className="parent-adventure-values"><div><span>{pick("النتيجة", "Score")}</span><strong>{Number(adventure.score) || 0}%</strong></div><div><span>{pick("النقاط", "Points")}</span><strong>{Number(adventure.earned_points) || 0}</strong></div></div><div className="parent-completion-status">{adventure.completed ? pick("مكتملة", "Completed") : adventure.started_at ? pick("قيد التقدم", "In Progress") : pick("لم تبدأ", "Not Started")}</div></article>)}</section>
        <section className="parent-assessment-section"><div className="parent-progress-heading"><span>{pick("التقييمات", "ASSESSMENTS")}</span><h2>{pick("تحسن التعلم", "Learning Improvement")}</h2></div><div className="parent-assessment-grid"><article><span>🧠</span><small>{pick("الاختبار القبلي", "Pre-Test")}</small><strong>{assessment.pre_test_score != null ? `${assessment.pre_test_score}%` : pick("غير مكتمل", "Not completed")}</strong></article><div className="parent-assessment-arrow">{isArabic ? "←" : "→"}</div><article><span>🎯</span><small>{pick("الاختبار البعدي", "Post-Test")}</small><strong>{assessment.post_test_score != null ? `${assessment.post_test_score}%` : pick("غير مكتمل", "Not completed")}</strong></article><article className="parent-improvement-card"><span>📈</span><small>{pick("التحسن", "Improvement")}</small><strong>{assessment.improvement != null ? `${assessment.improvement > 0 ? "+" : ""}${assessment.improvement}%` : "—"}</strong></article></div></section>
        <section className="parent-badges-section"><div className="parent-progress-heading"><span>{pick("الإنجازات", "ACHIEVEMENTS")}</span><h2>{pick("الشارات المكتسبة", "Badges Earned")}</h2></div>{badges.length ? <div className="parent-badges-grid">{badges.map((badge) => <article key={badge.badge_id}><span>🏅</span><strong>{(isArabic ? badge.title_ar : badge.title_en) || badge.title_en || badge.title_ar}</strong><p>{(isArabic ? badge.description_ar : badge.description_en) || badge.description_en || badge.description_ar}</p></article>)}</div> : <div className="no-parent-badges">🏅 {pick("لم يتم الحصول على شارات بعد.", "No badges earned yet.")}</div>}</section>
        <section className="parent-safety-message"><span>💬</span><div><strong>{pick("تحدثوا عن الأمان الرقمي معاً", "Talk about digital safety together")}</strong><p>{pick("اسأل طفلك عما تعلمه وشجعه على إخبار شخص بالغ موثوق عندما يشعر بعدم الراحة على الإنترنت.", "Ask your child what they learned and encourage them to tell a trusted adult whenever something online feels uncomfortable.")}</p></div></section>
      </div>
    </main>
  );
}

export default ChildProgress;
