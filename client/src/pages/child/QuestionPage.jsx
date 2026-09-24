import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/api.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import ChildNav from "../../components/child/ChildNav.jsx";
import "./QuestionPage.css";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/, "");
const mediaUrl = (value) => !value ? null : /^https?:\/\//.test(value) ? value : `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;

function QuestionPage() {
  const { adventureId } = useParams();
  const navigate = useNavigate();
  const { isArabic, pick } = useLanguage();
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  const [lastProgress, setLastProgress] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const id = Number(adventureId);
  const invalidAdventureId = !Number.isInteger(id) || id <= 0;

  useEffect(() => {
    if (invalidAdventureId) return undefined;

    let active = true;

    api.get(`/questions/adventure/${id}`)
      .then((response) => { if (active) setQuestions([...(response.data?.questions || [])].sort((a, b) => Number(a.display_order) - Number(b.display_order))); })
      .catch((err) => { if (!active) return; if (err.response?.status === 401) navigate("/child/login", { replace: true }); else setError(err.response?.data?.message || pick("تعذر تحميل المغامرة.", "Could not load the adventure.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, invalidAdventureId, navigate, pick]);

  const question = questions[index];
  const options = useMemo(() => !question ? [] : [
    { value: "A", text: (isArabic ? question.option_a_ar : question.option_a_en) || question.option_a_en || question.option_a_ar },
    { value: "B", text: (isArabic ? question.option_b_ar : question.option_b_en) || question.option_b_en || question.option_b_ar },
    { value: "C", text: (isArabic ? question.option_c_ar : question.option_c_en) || question.option_c_en || question.option_c_ar },
  ], [question, isArabic]);

  async function submitAnswer() {
    if (!selected || !question) return;
    try {
      setSubmitting(true); setError("");
      const response = await api.post(`/questions/${question.id}/answer`, { answer: selected });
      setResult(response.data);
      if (response.data?.progress) setLastProgress(response.data.progress);
      if (Array.isArray(response.data?.new_badges)) setNewBadges((previous) => [...previous, ...response.data.new_badges]);
    } catch (err) {
      if (err.response?.status === 401) return navigate("/child/login", { replace: true });
      setError(err.response?.data?.message || pick("تعذر إرسال إجابتك.", "Could not submit your answer."));
    } finally { setSubmitting(false); }
  }

  const nextQuestion = () => { if (index < questions.length - 1) { setIndex((current) => current + 1); setSelected(""); setResult(null); setError(""); } else setFinished(true); };
  const progressPercent = questions.length ? Math.round(((index + 1) / questions.length) * 100) : 0;

  if (invalidAdventureId) {
    return (
      <main className="question-page" data-no-auto-translate="true">
        <ChildNav />
        <div className="question-loading">
          <span className="large-icon">⚠️</span>
          <h2>{pick("المغامرة غير موجودة.", "Adventure not found.")}</h2>
          <Link to="/child/adventures" className="question-home-button">
            {pick("العودة إلى المغامرات", "Back to Adventures")}
          </Link>
        </div>
      </main>
    );
  }

  if (loading) return <main className="question-page" data-no-auto-translate="true"><ChildNav /><div className="question-loading"><div className="adventures-spinner" /><h2>{pick("جارٍ تحميل التحدي...", "Loading challenge...")}</h2></div></main>;
  if (error && !questions.length) return <main className="question-page" data-no-auto-translate="true"><ChildNav /><div className="question-loading"><span className="large-icon">⚠️</span><h2>{error}</h2><Link to="/child/adventures" className="question-home-button">{pick("العودة إلى المغامرات", "Back to Adventures")}</Link></div></main>;
  if (!questions.length) return <main className="question-page" data-no-auto-translate="true"><ChildNav /><div className="question-loading"><span className="large-icon">🧭</span><h2>{pick("لا توجد أسئلة متاحة.", "No questions available.")}</h2><Link to="/child/adventures" className="question-home-button">{pick("عودة", "Back")}</Link></div></main>;

  if (finished) return <main className="question-page" data-no-auto-translate="true"><ChildNav /><section className="adventure-complete-card"><div className="completion-icon">🎉</div><span className="completion-label">{pick("اكتملت المغامرة", "ADVENTURE COMPLETE")}</span><h1>{pick("عمل رائع!", "Great Work!")}</h1><p>{pick("أنهيت مغامرة الأمان الرقمي بنجاح.", "You finished this digital safety adventure.")}</p>{lastProgress && <div className="completion-stats"><article><span>🎯</span><strong>{lastProgress.score ?? 0}%</strong><p>{pick("النتيجة", "Score")}</p></article><article><span>⭐</span><strong>{lastProgress.earned_points ?? 0}</strong><p>{pick("النقاط المكتسبة", "Points Earned")}</p></article></div>}{newBadges.length > 0 && <div className="badge-unlocked"><span>🏆</span><div><strong>{pick("شارة جديدة!", "New Badge Unlocked!")}</strong><p>{newBadges.map((badge) => (isArabic ? badge.title_ar : badge.title_en) || badge.title_en || badge.name || pick("شارة أمان رقمي", "Digital Safety Badge")).join(", ")}</p></div></div>}<div className="completion-actions"><Link to="/child/adventures">{pick("مغامرات أخرى", "More Adventures")}</Link><Link to="/child/badges">{pick("شاراتي", "My Badges")}</Link></div></section></main>;

  const story = (isArabic ? question.story_text_ar : question.story_text_en) || question.story_text_en || question.story_text_ar;
  const title = (isArabic ? question.question_ar : question.question_en) || question.question_en || question.question_ar;
  const feedback = (isArabic ? result?.feedback_ar : result?.feedback_en) || result?.feedback_en || result?.feedback_ar;

  return (
    <main className="question-page" data-no-auto-translate="true">
      <ChildNav />
      <div className="question-container">
        <header className="question-header"><Link to={`/child/adventures/${adventureId}`}>{pick("الخروج من المغامرة →", "← Exit Adventure")}</Link><span>{pick("السؤال", "Question")} {index + 1} {pick("من", "of")} {questions.length}</span></header>
        <div className="question-progress"><div style={{ width: `${progressPercent}%` }} /></div>
        <section className="question-card">
          {story && <div className="story-box"><span>📖 {pick("الموقف", "Scenario")}</span><p>{story}</p></div>}
          {question.image_url && <img className="question-image" src={mediaUrl(question.image_url)} alt="" />}
          <div className="question-title"><span>{pick("السؤال", "Question")} {index + 1}</span><h1>{title}</h1></div>
          <div className="question-options">{options.map((option) => <button key={option.value} type="button" disabled={Boolean(result) || submitting} className={`question-option ${selected === option.value ? "selected" : ""}`} onClick={() => setSelected(option.value)}><span className="option-letter">{option.value}</span><div><strong>{option.text}</strong></div></button>)}</div>
          {error && <div className="question-error" role="alert">{error}</div>}
          {!result && <button type="button" className="submit-answer" disabled={!selected || submitting} onClick={submitAnswer}>{submitting ? pick("جارٍ التحقق...", "Checking...") : pick("تحقق من إجابتي", "Check My Answer")}</button>}
          {result && <section className={`answer-feedback ${result.correct ? "correct" : "wrong"}`}><span className="feedback-icon">{result.correct ? "✅" : "💡"}</span><div><h3>{result.correct ? pick("أحسنت!", "Great job!") : pick("اقتربت!", "Almost!")}</h3><p>{feedback || (result.correct ? pick("هذا هو الاختيار الآمن.", "That is the safe choice.") : pick("فكر في الاختيار الأكثر أماناً وحاول مرة أخرى.", "Think about the safest choice and try again."))}</p>{result.correct && Number(result.points) > 0 && <strong className="points-earned">+{result.points} {pick("نقطة", "points")} ⭐</strong>}</div></section>}
          {result && !result.correct && <button type="button" className="try-again-button" onClick={() => { setSelected(""); setResult(null); }}>🔄 {pick("حاول مرة أخرى", "Try Again")}</button>}
          {result?.correct && <button type="button" className="next-question-button" onClick={nextQuestion}>{index === questions.length - 1 ? pick("إنهاء المغامرة 🎉", "Finish Adventure 🎉") : pick("السؤال التالي", "Next Question →")}</button>}
        </section>
      </div>
    </main>
  );
}

export default QuestionPage;
