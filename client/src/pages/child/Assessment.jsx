import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/api.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import ChildNav from "../../components/child/ChildNav.jsx";
import "./Assessment.css";

const TEST_CONFIG = {
  pre_test: {
    title: "Digital Safety Pre-Test",
    titleAr: "اختبار الأمان الرقمي القبلي",
    subtitle: "Let's see what you already know before your adventures.",
    subtitleAr: "لنكتشف ما تعرفه قبل أن تبدأ مغامراتك.",
    icon: "🧠",
    colorClass: "pre-test",
  },
  post_test: {
    title: "Digital Safety Post-Test",
    titleAr: "اختبار الأمان الرقمي البعدي",
    subtitle: "Let's see how much your digital safety skills have improved.",
    subtitleAr: "لنرَ كيف تطورت مهاراتك في الأمان الرقمي بعد المغامرات.",
    icon: "🎯",
    colorClass: "post-test",
  },
};

function getQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.questions)) return data.questions;
  return Array.isArray(data?.data) ? data.data : [];
}

function Assessment() {
  const { testType } = useParams();
  const navigate = useNavigate();
  const { isArabic, pick } = useLanguage();
  const config = TEST_CONFIG[testType];
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [existingResults, setExistingResults] = useState(null);

  useEffect(() => {
    if (!config) return undefined;
    let active = true;
    async function load() {
      try {
        const questionResponse = await api.get(`/assessments/${testType}`);
        let results = null;
        try { results = (await api.get("/assessments/results/me")).data?.results || null; } catch (err) { if (err.response?.status !== 404) throw err; }
        if (!active) return;
        const loaded = getQuestions(questionResponse.data).sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0));
        setQuestions(loaded);
        setExistingResults(results);
        const score = testType === "pre_test" ? results?.pre_test_score : results?.post_test_score;
        if (score !== null && score !== undefined) setResult({ alreadyCompleted: true, test_type: testType, score_percentage: Number(score) });
      } catch (err) {
        if (!active) return;
        if (err.response?.status === 401) navigate("/child/login", { replace: true });
        else setError(err.response?.data?.message || pick("تعذر تحميل التقييم.", "Could not load the assessment."));
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [config, navigate, testType, pick]);

  const question = questions[index];
  const options = useMemo(() => question ? [
    ["A", (isArabic ? question.option_a_ar : question.option_a_en) || question.option_a_en || question.option_a_ar],
    ["B", (isArabic ? question.option_b_ar : question.option_b_en) || question.option_b_en || question.option_b_ar],
    ["C", (isArabic ? question.option_c_ar : question.option_c_en) || question.option_c_en || question.option_c_ar],
  ] : [], [question, isArabic]);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const pageProgress = questions.length ? Math.round(((index + 1) / questions.length) * 100) : 0;

  async function submitAssessment() {
    if (!allAnswered) {
      setError(pick("أجب عن جميع الأسئلة قبل الإرسال.", "Please answer every question before submitting."));
      const first = questions.findIndex((item) => !answers[item.id]);
      if (first !== -1) setIndex(first);
      return;
    }
    try {
      setSubmitting(true); setError("");
      const response = await api.post(`/assessments/${testType}/submit`, { answers: questions.map((item) => ({ question_id: item.id, answer: answers[item.id] })) });
      setResult(response.data?.result || null);
      try { setExistingResults((await api.get("/assessments/results/me")).data?.results || null); } catch { /* result already received */ }
    } catch (err) {
      if (err.response?.status === 401) { navigate("/child/login", { replace: true }); return; }
      if (err.response?.status === 409) { setError(pick("لقد أكملت هذا التقييم مسبقاً.", "This assessment has already been completed.")); return; }
      setError(err.response?.data?.message || pick("تعذر إرسال التقييم.", "Could not submit your assessment."));
    } finally { setSubmitting(false); }
  }

  if (!config) return <main className="assessment-page" data-no-auto-translate="true"><ChildNav /><section className="assessment-state-card"><span>⚠️</span><h1>{pick("تقييم غير صالح", "Invalid Assessment")}</h1><Link to="/child/dashboard">{pick("العودة إلى لوحة التحكم", "Back to Dashboard")}</Link></section></main>;
  if (loading) return <main className="assessment-page" data-no-auto-translate="true"><ChildNav /><section className="assessment-state-card"><div className="assessment-spinner" /><h2>{pick("نجهّز الاختبار...", "Preparing your test...")}</h2><p>{pick("جارٍ تحميل تحدي الأمان الرقمي.", "Your digital safety challenge is loading.")}</p></section></main>;

  if (result?.score_percentage !== undefined) {
    const score = Number(result.score_percentage) || 0;
    const improvement = Number(existingResults?.improvement);
    return (
      <main className={`assessment-page ${config.colorClass}`} data-no-auto-translate="true">
        <ChildNav />
        <section className="assessment-result-card">
          <div className="result-celebration">{score >= 80 ? "🏆" : score >= 60 ? "⭐" : "🌱"}</div>
          <span className="result-label">{result.alreadyCompleted ? pick("تم إكمال التقييم مسبقاً", "ASSESSMENT ALREADY COMPLETED") : pick("اكتمل التقييم", "ASSESSMENT COMPLETE")}</span>
          <h1>{isArabic ? config.titleAr : config.title}</h1>
          <div className="score-circle"><strong>{score % 1 ? score.toFixed(2) : score}%</strong><span>{pick("نتيجتك", "Your Score")}</span></div>
          {result.correct_answers !== undefined && <p className="score-detail">{pick(`أجبت بشكل صحيح عن ${result.correct_answers} من ${result.total_questions}.`, `You answered ${result.correct_answers} out of ${result.total_questions} correctly.`)}</p>}
          {testType === "post_test" && Number.isFinite(improvement) && <div className="improvement-card">📈 <div><strong>{pick("تحسن التعلم", "Learning Improvement")}</strong><p>{improvement >= 0 ? "+" : ""}{improvement.toFixed(2)}%</p></div></div>}
          <div className="assessment-score-comparison"><article><span>{pick("الاختبار القبلي", "Pre-Test")}</span><strong>{existingResults?.pre_test_score ?? "—"}{existingResults?.pre_test_score != null ? "%" : ""}</strong></article><div>→</div><article><span>{pick("الاختبار البعدي", "Post-Test")}</span><strong>{existingResults?.post_test_score ?? "—"}{existingResults?.post_test_score != null ? "%" : ""}</strong></article></div>
          <div className="assessment-result-actions">
            <Link to="/child/dashboard">{pick("لوحة التحكم", "Dashboard")}</Link>
            <Link to={testType === "pre_test" && existingResults?.post_test_score == null ? "/child/adventures" : "/child/badges"}>
              {testType === "pre_test" && existingResults?.post_test_score == null
                ? pick("ابدأ المغامرات 🚀", "Start Adventures 🚀")
                : pick("شاراتي 🏆", "My Badges 🏆")}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (error && !questions.length) return <main className="assessment-page" data-no-auto-translate="true"><ChildNav /><section className="assessment-state-card"><span>⚠️</span><h2>{error}</h2><Link to="/child/dashboard">{pick("العودة إلى لوحة التحكم", "Back to Dashboard")}</Link></section></main>;
  if (!questions.length) return <main className="assessment-page" data-no-auto-translate="true"><ChildNav /><section className="assessment-state-card"><span>🧠</span><h2>{pick("لا توجد أسئلة تقييم متاحة.", "No assessment questions available.")}</h2><Link to="/child/dashboard">{pick("عودة", "Back")}</Link></section></main>;

  const story = (isArabic ? question.story_text_ar : question.story_text_en) || question.story_text_en || question.story_text_ar;
  const title = (isArabic ? question.question_ar : question.question_en) || question.question_en || question.question_ar;

  return (
    <main className={`assessment-page ${config.colorClass}`} data-no-auto-translate="true">
      <ChildNav />
      <div className="assessment-container">
        <header className="assessment-header"><Link to="/child/dashboard">{pick("الخروج من الاختبار →", "← Exit Test")}</Link><span>{pick("السؤال", "Question")} {index + 1} {pick("من", "of")} {questions.length}</span></header>
        <section className="assessment-intro"><span className="assessment-intro-icon">{config.icon}</span><div><span className="assessment-eyebrow">{pick("تقييم الأمان الرقمي", "DIGITAL SAFETY ASSESSMENT")}</span><h1>{isArabic ? config.titleAr : config.title}</h1><p>{isArabic ? config.subtitleAr : config.subtitle}</p></div></section>
        <section className="assessment-progress-card"><div className="assessment-progress-info"><span>{pick("تقدم الأسئلة", "Question Progress")}</span><strong>{pageProgress}%</strong></div><div className="assessment-progress-track"><div style={{ width: `${pageProgress}%` }} /></div><small>{pick(`${answeredCount} من ${questions.length} تمت الإجابة عنها`, `${answeredCount} of ${questions.length} answered`)}</small></section>
        <section className="assessment-question-card">
          {story && <div className="assessment-story"><span>📖 {pick("الموقف", "Situation")}</span><p>{story}</p></div>}
          <div className="assessment-question-heading"><span>{pick("السؤال", "Question")} {index + 1}</span><h2>{title}</h2></div>
          <div className="assessment-options">{options.map(([value, text]) => <button key={value} type="button" className={`assessment-option ${answers[question.id] === value ? "selected" : ""}`} onClick={() => { setAnswers((previous) => ({ ...previous, [question.id]: value })); setError(""); }}><span className="assessment-option-letter">{value}</span><div><strong>{text}</strong></div></button>)}</div>
          {error && <div className="assessment-error" role="alert">⚠️ {error}</div>}
          <div className="assessment-navigation">
            <button type="button" className="assessment-previous" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}>{pick("السابق →", "← Previous")}</button>
            {index < questions.length - 1 ? <button type="button" className="assessment-next" onClick={() => question && answers[question.id] ? setIndex((current) => current + 1) : setError(pick("اختر إجابة قبل المتابعة.", "Choose an answer before continuing."))}>{pick("السؤال التالي ←", "Next Question →")}</button> : <button type="button" className="assessment-submit" disabled={!allAnswered || submitting} onClick={submitAssessment}>{submitting ? pick("جارٍ الإرسال...", "Submitting...") : pick("إنهاء التقييم ✓", "Finish Assessment ✓")}</button>}
          </div>
          <div className="question-jump-grid">{questions.map((item, itemIndex) => <button key={item.id} type="button" className={`${itemIndex === index ? "current" : ""} ${answers[item.id] ? "answered" : ""}`} onClick={() => setIndex(itemIndex)}>{itemIndex + 1}</button>)}</div>
          <p className="assessment-security-note">🛡️ {pick("يتم التحقق من إجاباتك بأمان بعد إرسال الاختبار.", "Your answers are checked securely by Amanak Alraqami after you submit the test.")}</p>
        </section>
      </div>
    </main>
  );
}

export default Assessment;
