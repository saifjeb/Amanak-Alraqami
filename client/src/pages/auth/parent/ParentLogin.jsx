import { useState } from "react";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthPortal from "../../../components/auth/AuthPortal.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { useLanguage } from "../../../i18n/useLanguage.js";
import familyImage from "../../../assets/family-digital-safety.webp";
import "./ParentLogin.css";

function ParentLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, role, loading, parentLogin } = useAuth();

  const { pick } = useLanguage();

  const initialEmail =
    typeof location.state?.email === "string" ? location.state.email : "";

  const [form, setForm] = useState({
    email: initialEmail,
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const emailVerified = location.state?.emailVerified === true;

  if (loading) {
    return (
      <main className="auth-loading">
        <div className="auth-loading-spinner" />

        <p>{pick("جارٍ التحقق من الجلسة...", "Checking your session...")}</p>
      </main>
    );
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

  async function handleSubmit(e) {
    e.preventDefault();

    const email = form.email.trim().toLowerCase();

    if (!email) {
      setError(
        pick("أدخل بريدك الإلكتروني.", "Please enter your email address."),
      );

      return;
    }

    if (!form.password) {
      setError(pick("أدخل كلمة المرور.", "Please enter your password."));

      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await parentLogin({
        email,
        password: form.password,
      });

      const from = location.state?.from;

      navigate(
        typeof from === "string" && from.startsWith("/parent/")
          ? from
          : "/parent/dashboard",
        {
          replace: true,
        },
      );
    } catch (err) {
      const status = err.response?.status;

      const responseData = err.response?.data;

      if (status === 403 && responseData?.code === "EMAIL_NOT_VERIFIED") {
        navigate("/parent/verify-email", {
          replace: true,
          state: {
            email: responseData?.email || email,
          },
        });

        return;
      }

      if (status === 429) {
        setError(
          pick(
            "محاولات كثيرة جداً. حاول لاحقاً.",
            "Too many login attempts. Please try later.",
          ),
        );
      } else if (status === 400 || status === 401) {
        setError(
          responseData?.message ||
            pick(
              "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
              "Email or password is incorrect.",
            ),
        );
      } else if (status === 403) {
        setError(
          responseData?.message ||
            pick(
              "هذا الحساب غير قادر على تسجيل الدخول.",
              "This account cannot sign in.",
            ),
        );
      } else {
        setError(
          !err.response
            ? pick(
                "لا يمكن الاتصال بأمانك الآن.",
                "Cannot connect to Amanak right now.",
              )
            : responseData?.message ||
                pick("فشل تسجيل الدخول.", "Login failed."),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPortal
      tone="parent"
      eyebrow={pick("مساحة ولي الأمر", "PARENT SPACE")}
      title={pick(
        "تابع رحلتهم الرقمية بثقة.",
        "Guide their digital journey with confidence.",
      )}
      subtitle={pick(
        "شاهد التقدم والإنجازات والتقييمات، وساعد طفلك على بناء عادات رقمية أكثر أماناً.",
        "See progress, achievements and assessments, and help your child build safer digital habits.",
      )}
      image={familyImage}
      imageAlt={pick(
        "عائلة تستخدم التقنية معاً",
        "Family using technology together",
      )}
      features={[
        pick("📊 متابعة التقدم", "📊 Track progress"),
        pick("🏆 مشاهدة الإنجازات", "🏆 View achievements"),
        pick("🛡️ دعم عادات آمنة", "🛡️ Support safe habits"),
      ]}
      panelEyebrow={pick("مرحباً بعودتك", "WELCOME BACK")}
      panelTitle={pick("تسجيل دخول ولي الأمر", "Parent Login")}
      panelSubtitle={pick(
        "ادخل إلى لوحة ولي الأمر لمتابعة رحلة طفلك.",
        "Sign in to follow your child's journey.",
      )}
    >
      {emailVerified && (
        <div className="auth-success">
          ✅{" "}
          {pick(
            "تم التحقق من بريدك الإلكتروني. يمكنك الآن تسجيل الدخول.",
            "Your email has been verified. You can now sign in.",
          )}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
              placeholder="parent@example.com"
              autoComplete="email"
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
              autoComplete="current-password"
              placeholder={pick("كلمة المرور", "Password")}
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

        <div className="auth-forgot-password">
          <Link to="/parent/forgot-password">
            {pick("نسيت كلمة المرور؟", "Forgot password?")}
          </Link>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting
            ? pick("جارٍ تسجيل الدخول...", "Signing in...")
            : pick("دخول لوحة ولي الأمر", "Open Parent Dashboard")}
        </button>
      </form>

      <div className="auth-secondary">
        {pick("جديد في أمانك؟", "New to Amanak?")}{" "}
        <Link to="/parent/register">
          {pick("أنشئ حساب ولي أمر", "Create parent account")}
        </Link>
      </div>

      <div className="auth-security">
        🔒{" "}
        {pick(
          "جلسة ولي الأمر محمية ومعلومات الطفل لا تظهر إلا للحسابات المرتبطة.",
          "Parent sessions are protected and child data is only shown to linked accounts.",
        )}
      </div>
    </AuthPortal>
  );
}

export default ParentLogin;
