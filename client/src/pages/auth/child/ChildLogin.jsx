import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthPortal from "../../../components/auth/AuthPortal.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { useLanguage } from "../../../i18n/useLanguage.js";
import heroesImage from "../../../assets/amanak-heroes.webp";
import "./ChildLogin.css";

function ChildLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { childLogin, user, role, loading: authLoading } = useAuth();
  const { pick } = useLanguage();
  const [form, setForm] = useState({ nickname: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return <main className="auth-loading"><div className="auth-loading-spinner"/><p>{pick("جارٍ التحقق من حسابك...", "Checking your account...")}</p></main>;
  if (user && role === "child") return <Navigate to="/child/dashboard" replace />;

  function handleChange(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.nickname.trim()) return setError(pick("أدخل اسمك المستعار.", "Please enter your nickname."));
    if (!form.password) return setError(pick("أدخل كلمة المرور.", "Please enter your password."));
    try {
      setSubmitting(true); setError("");
      await childLogin({ nickname: form.nickname.trim(), password: form.password });
      const from = location.state?.from;
      navigate(typeof from === "string" && from.startsWith("/child/") ? from : "/child/dashboard", { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) setError(pick("محاولات كثيرة جداً. انتظر قليلاً ثم حاول مرة أخرى.", "Too many login attempts. Please wait and try again."));
      else if (status === 403) setError(pick("هذا الحساب غير متاح حالياً. اطلب المساعدة من ولي الأمر أو المشرف.", "This account is currently unavailable. Ask a parent or administrator for help."));
      else if (status === 401) setError(pick("الاسم المستعار أو كلمة المرور غير صحيحة.", "The nickname or password is incorrect."));
      else if (!err.response) setError(pick("لا يمكن الاتصال بالخادم الآن.", "We could not connect to the server."));
      else setError(pick("حدث خطأ. حاول مرة أخرى.", "Something went wrong. Please try again."));
    } finally { setSubmitting(false); }
  }

  return (
    <AuthPortal
      tone="child"
      eyebrow={pick("مساحة الطالب", "STUDENT SPACE")}
      title={pick("ارجع إلى مغامرتك الرقمية.", "Jump back into your digital adventure.")}
      subtitle={pick("تعلّم مهارات رقمية حقيقية، اجمع النقاط، وافتح شارات جديدة من خلال مغامرات قصيرة وتفاعلية.", "Build real digital skills, collect points, and unlock badges through short interactive adventures.")}
      image={heroesImage}
      imageAlt={pick("أبطال أمانك الرقمي", "Amanak digital safety heroes")}
      features={[pick("🎮 مغامرات تفاعلية", "🎮 Interactive adventures"), pick("⭐ نقاط وشارات", "⭐ Points & badges"), pick("🛡️ مهارات أمان حقيقية", "🛡️ Real safety skills")]}
      panelEyebrow={pick("مرحباً بعودتك", "WELCOME BACK")}
      panelTitle={pick("تسجيل دخول الطالب", "Student Login")}
      panelSubtitle={pick("استخدم اسمك المستعار وكلمة المرور للمتابعة.", "Use your nickname and password to continue.")}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field"><label htmlFor="nickname">{pick("الاسم المستعار", "Nickname")}</label><div className="auth-input-wrap has-leading"><UserRound size={18}/><input id="nickname" name="nickname" value={form.nickname} onChange={handleChange} placeholder={pick("مثال: CyberTiger", "Example: CyberTiger")} autoComplete="username" disabled={submitting}/></div></div>
        <div className="auth-field"><label htmlFor="password">{pick("كلمة المرور", "Password")}</label><div className="auth-input-wrap has-leading"><LockKeyhole size={18}/><input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder={pick("كلمة مرورك السرية", "Your secret password")} autoComplete="current-password" disabled={submitting}/><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={pick("إظهار أو إخفاء كلمة المرور", "Show or hide password")}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>
        {error && <div className="auth-error">⚠️ {error}</div>}
        <button type="submit" className="auth-submit" disabled={submitting}>{submitting ? pick("جارٍ تسجيل الدخول...", "Signing in...") : pick("تابع إلى المغامرة", "Continue to Adventure")}</button>
      </form>
      <div className="auth-secondary">{pick("جديد في أمانك؟", "New to Amanak?")} <Link to="/child/register">{pick("أنشئ حساب طالب", "Create student account")}</Link></div>
      <div className="auth-security">🛡️ {pick("احتفظ بكلمة مرورك لنفسك ولا تشاركها مع أطفال آخرين.", "Keep your password private and never share it with another child.")}</div>
    </AuthPortal>
  );
}
export default ChildLogin;
