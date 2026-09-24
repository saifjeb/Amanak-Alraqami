import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import AuthPortal from "../../../components/auth/AuthPortal.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { useLanguage } from "../../../i18n/useLanguage.js";
import familyImage from "../../../assets/family-digital-safety.webp";
import "./ParentRegister.css";

function ParentRegister() {
  const navigate = useNavigate();

  const { user, role, loading, parentRegister } = useAuth();

  const { pick } = useLanguage();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  if (loading) {
    return null;
  }

  if (user && role === "parent") {
    return <Navigate to="/parent/dashboard" replace />;
  }

  function handleChange(e) {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));

    setError("");
  }

  function validateForm() {
    const name = form.name.trim();

    const email = form.email.trim().toLowerCase();

    if (name.length < 2) {
      return pick(
        "الاسم يجب أن يتكون من حرفين على الأقل.",
        "Name must be at least 2 characters.",
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return pick(
        "أدخل بريداً إلكترونياً صحيحاً.",
        "Please enter a valid email address.",
      );
    }

    if (form.password.length < 8) {
      return pick(
        "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
        "Password must be at least 8 characters.",
      );
    }

    if (form.password !== form.confirmPassword) {
      return pick("كلمتا المرور غير متطابقتين.", "Passwords do not match.");
    }

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const message = validateForm();

    if (message) {
      setError(message);
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();

    try {
      setSubmitting(true);
      setError("");

      await parentRegister({
        name: form.name.trim(),
        email: normalizedEmail,
        password: form.password,
        confirm_password: form.confirmPassword,
      });

      navigate("/parent/verify-email", {
        replace: true,
        state: {
          email: normalizedEmail,
        },
      });
    } catch (err) {
      const status = err.response?.status;

      if (status === 409) {
        setError(
          err.response?.data?.message ||
            pick(
              "يوجد حساب بهذا البريد بالفعل.",
              "An account with this email already exists.",
            ),
        );
      } else if (status === 429) {
        setError(
          pick(
            "محاولات كثيرة جداً. حاول لاحقاً.",
            "Too many registration attempts. Try later.",
          ),
        );
      } else {
        setError(
          err.response?.data?.message ||
            pick("تعذر إنشاء الحساب.", "Could not create your account."),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPortal
      tone="parent"
      eyebrow={pick("انضم كولي أمر", "JOIN AS A PARENT")}
      title={pick(
        "كن جزءاً من مستقبل رقمي أكثر أماناً.",
        "Be part of their safer digital future.",
      )}
      subtitle={pick(
        "أنشئ حساباً آمناً، اربط أطفالك برمز مؤقت، وتابع تعلمهم بدون التدخل في خصوصيتهم.",
        "Create a secure account, link children with a temporary code, and support learning without invading their privacy.",
      )}
      image={familyImage}
      imageAlt={pick(
        "عائلة تستخدم التقنية معاً",
        "Family using technology together",
      )}
      features={[
        pick("🔗 ربط آمن", "🔗 Safe linking"),
        pick("📈 رؤية التقدم", "📈 Progress insights"),
        pick("💬 دعم الحوار", "💬 Better conversations"),
      ]}
      panelEyebrow={pick("ابدأ الآن", "GET STARTED")}
      panelTitle={pick("إنشاء حساب ولي أمر", "Create Parent Account")}
      panelSubtitle={pick(
        "أدخل معلوماتك الأساسية لإنشاء حسابك.",
        "Enter your basic details to create your account.",
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="parent-name">
            {pick("الاسم الكامل", "Full name")}
          </label>

          <div className="auth-input-wrap has-leading">
            <UserRound size={18} />

            <input
              id="parent-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="parent-email">
            {pick("البريد الإلكتروني", "Email address")}
          </label>

          <div className="auth-input-wrap has-leading">
            <Mail size={18} />

            <input
              id="parent-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="parent@example.com"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="parent-password">
            {pick("كلمة المرور", "Password")}
          </label>

          <div className="auth-input-wrap has-leading">
            <LockKeyhole size={18} />

            <input
              id="parent-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />

            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={pick(
                showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور",
                showPassword ? "Hide password" : "Show password",
              )}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="parent-confirm">
            {pick("تأكيد كلمة المرور", "Confirm password")}
          </label>

          <div className="auth-input-wrap has-leading">
            <LockKeyhole size={18} />

            <input
              id="parent-confirm"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />

            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={pick(
                showConfirmPassword
                  ? "إخفاء تأكيد كلمة المرور"
                  : "إظهار تأكيد كلمة المرور",
                showConfirmPassword
                  ? "Hide password confirmation"
                  : "Show password confirmation",
              )}
            >
              {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting
            ? pick("جارٍ إنشاء الحساب...", "Creating account...")
            : pick("إنشاء حساب ولي الأمر", "Create Parent Account")}
        </button>
      </form>

      <div className="auth-secondary">
        {pick("لديك حساب بالفعل؟", "Already have an account?")}{" "}
        <Link to="/parent/login">{pick("سجّل الدخول", "Sign in")}</Link>
      </div>

      <div className="auth-security">
        🛡️{" "}
        {pick(
          "سيتم إرسال رمز تحقق إلى بريدك الإلكتروني قبل تفعيل الحساب.",
          "A verification code will be sent to your email before the account is activated.",
        )}
      </div>
    </AuthPortal>
  );
}

export default ParentRegister;
