import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthPortal from "../../../components/auth/AuthPortal.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { useLanguage } from "../../../i18n/useLanguage.js";
import heroesImage from "../../../assets/amanak-heroes.webp";
import avatarExplorer from "../../../assets/avatar-explorer.webp";
import avatarHero from "../../../assets/avatar-hero.webp";
import avatarGuardian from "../../../assets/avatar-guardian.webp";
import avatarDetective from "../../../assets/avatar-detective.webp";
import "./ChildRegister.css";

function ChildRegister() {
  const navigate = useNavigate();
  const { childRegister, user, role, loading } = useAuth();
  const { pick } = useLanguage();
  const [form, setForm] = useState({ nickname:"", password:"", confirmPassword:"", age_group:"", avatar:"avatar1" });
  const [showPassword,setShowPassword]=useState(false); const [showConfirmPassword,setShowConfirmPassword]=useState(false); const [submitting,setSubmitting]=useState(false); const [error,setError]=useState("");
  if (loading) return null;
  if (user && role === "child") return <Navigate to="/child/dashboard" replace/>;

  const avatars=[
    {value:"avatar1",label:pick("المستكشف","Explorer"),image:avatarExplorer,className:"avatar-blue"},
    {value:"avatar2",label:pick("البطل","Hero"),image:avatarHero,className:"avatar-orange"},
    {value:"avatar3",label:pick("الحامي","Guardian"),image:avatarGuardian,className:"avatar-green"},
    {value:"avatar4",label:pick("المحقق","Detective"),image:avatarDetective,className:"avatar-yellow"},
  ];

  function handleChange(event){setForm((p)=>({...p,[event.target.name]:event.target.value}));setError("");}
  function validate(){const nickname=form.nickname.trim(); if(nickname.length<3)return pick("اختر اسماً مستعاراً من 3 أحرف على الأقل.","Choose a nickname with at least 3 characters."); if(!form.age_group)return pick("اختر فئتك العمرية.","Choose your age group."); if(form.password.length<8)return pick("كلمة المرور يجب أن تكون 8 أحرف على الأقل.","Password must be at least 8 characters."); if(form.password!==form.confirmPassword)return pick("كلمتا المرور غير متطابقتين.","Passwords do not match."); return "";}
  async function handleSubmit(event){event.preventDefault();const message=validate();if(message)return setError(message);try{setSubmitting(true);setError("");await childRegister({nickname:form.nickname.trim(),password:form.password,confirm_password:form.confirmPassword,age_group:form.age_group,avatar:form.avatar});navigate("/child/dashboard",{replace:true});}catch(err){const status=err.response?.status;if(status===409)setError(pick("هذا الاسم مستخدم بالفعل. اختر اسماً آخر.","That nickname is already taken. Try another one."));else if(status===429)setError(pick("محاولات كثيرة جداً. حاول لاحقاً.","Too many attempts. Try again later."));else setError(err.response?.data?.message||pick("تعذر إنشاء الحساب.","Could not create your account."));}finally{setSubmitting(false)}}

  return <AuthPortal tone="child" eyebrow={pick("ابدأ رحلتك","START YOUR JOURNEY")} title={pick("اختر شخصيتك وابدأ مغامرتك.","Choose your hero and start exploring.")} subtitle={pick("لا تحتاج إلى بريد إلكتروني. اختر اسماً مستعاراً وفئتك العمرية وشخصيتك، ثم أنشئ كلمة مرور آمنة.","No email needed. Pick a nickname, age group and hero, then create a safe password.")} image={heroesImage} imageAlt="Amanak heroes" features={[pick("من 8 إلى 10 سنوات","Ages 8–10"),pick("من 11 إلى 14 سنة","Ages 11–14"),pick("حساب آمن بدون بريد","Safe account without email")]} panelEyebrow={pick("حساب جديد","NEW ACCOUNT")} panelTitle={pick("إنشاء حساب طالب","Create Student Account")} panelSubtitle={pick("ثلاث خطوات بسيطة ثم تبدأ المغامرة.","Three simple steps and you are ready to go.")}>
    <form className="auth-form student-register-form" onSubmit={handleSubmit} noValidate>
      <section className="register-step"><div className="register-step-title"><span>1</span><div><strong>{pick("من أنت؟","Who are you?")}</strong><small>{pick("اختر اسماً مستعاراً وفئتك العمرية.","Choose a nickname and age group.")}</small></div></div><div className="auth-field"><label htmlFor="nickname">{pick("الاسم المستعار","Nickname")}</label><div className="auth-input-wrap has-leading"><UserRound size={18}/><input id="nickname" name="nickname" value={form.nickname} onChange={handleChange} maxLength={50} placeholder="CyberTiger" disabled={submitting}/></div></div><div className="student-age-grid"><label><input type="radio" name="age_group" value="8-10" checked={form.age_group==="8-10"} onChange={handleChange}/><span>🎮 <strong>{pick("8–10 سنوات","Ages 8–10")}</strong></span></label><label><input type="radio" name="age_group" value="11-14" checked={form.age_group==="11-14"} onChange={handleChange}/><span>🚀 <strong>{pick("11–14 سنة","Ages 11–14")}</strong></span></label></div></section>
      <section className="register-step"><div className="register-step-title"><span>2</span><div><strong>{pick("اختر بطلك","Choose your hero")}</strong><small>{pick("يمكنك تغيير شخصيتك لاحقاً.","You can change your character later.")}</small></div></div><div className="student-avatar-grid">{avatars.map((avatar)=><button key={avatar.value} type="button" className={`student-avatar-card ${avatar.className} ${form.avatar===avatar.value?"selected":""}`} onClick={()=>setForm((p)=>({...p,avatar:avatar.value}))}><img src={avatar.image} alt=""/><strong>{avatar.label}</strong>{form.avatar===avatar.value&&<span className="student-avatar-check">✓</span>}</button>)}</div></section>
      <section className="register-step"><div className="register-step-title"><span>3</span><div><strong>{pick("أنشئ كلمة مرور سرية","Create your secret password")}</strong><small>{pick("استخدم 8 أحرف على الأقل ولا تشاركها مع أحد.","Use at least 8 characters and keep it private.")}</small></div></div><div className="auth-field"><label htmlFor="password">{pick("كلمة المرور","Password")}</label><div className="auth-input-wrap has-leading"><LockKeyhole size={18}/><input id="password" name="password" type={showPassword?"text":"password"} value={form.password} onChange={handleChange} autoComplete="new-password"/><button type="button" className="auth-password-toggle" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div><div className="auth-field"><label htmlFor="confirmPassword">{pick("تأكيد كلمة المرور","Confirm password")}</label><div className="auth-input-wrap has-leading"><LockKeyhole size={18}/><input id="confirmPassword" name="confirmPassword" type={showConfirmPassword?"text":"password"} value={form.confirmPassword} onChange={handleChange} autoComplete="new-password"/><button type="button" className="auth-password-toggle" onClick={()=>setShowConfirmPassword(v=>!v)}>{showConfirmPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div></section>
      {error&&<div className="auth-error">⚠️ {error}</div>}
      <button className="auth-submit" type="submit" disabled={submitting}>{submitting?pick("جارٍ إنشاء الحساب...","Creating account..."):pick("ابدأ مغامرتي 🚀","Start My Adventure 🚀")}</button>
    </form>
    <div className="auth-secondary">{pick("لديك حساب بالفعل؟","Already have an account?")} <Link to="/child/login">{pick("سجّل الدخول","Sign in")}</Link></div>
  </AuthPortal>;
}
export default ChildRegister;
