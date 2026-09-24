import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthPortal from "../../../components/auth/AuthPortal.jsx";
import { useAuth } from "../../../hooks/useAuth.js";
import { useLanguage } from "../../../i18n/useLanguage.js";
import heroesImage from "../../../assets/amanak-heroes.webp";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();
  const { user, role, loading, adminLogin } = useAuth();
  const { pick } = useLanguage();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <main className="auth-loading">
        <div className="auth-loading-spinner" />
        <p>
          {pick("جارٍ التحقق من جلسة الإدارة...", "Checking admin session...")}
        </p>
      </main>
    );
  }

  if (user && role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
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
      return setError(
        pick("أدخل بريد المشرف.", "Please enter your admin email."),
      );
    }

    if (form.password.length < 8) {
      return setError(
        pick(
          "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
          "Password must be at least 8 characters.",
        ),
      );
    }

    try {
      setSubmitting(true);
      setError("");

      await adminLogin({
        email,
        password: form.password,
      });

      navigate("/admin/dashboard", {
        replace: true,
      });
    } catch (err) {
      const status = err.response?.status;

      if (status === 429) {
        setError(
          pick(
            "محاولات كثيرة جداً. حاول لاحقاً.",
            "Too many login attempts. Try later.",
          ),
        );
      } else if (status === 400 || status === 401) {
        setError(
          err.response?.data?.message ||
            pick(
              "بيانات الدخول غير صحيحة.",
              "Invalid admin email or password.",
            ),
        );
      } else if (status === 403) {
        setError(
          pick(
            "غير مصرح لك بالدخول إلى الإدارة.",
            "You are not authorized to access the admin area.",
          ),
        );
      } else {
        setError(
          !err.response
            ? pick(
                "لا يمكن الاتصال بخادم أمانك.",
                "Cannot connect to Amanak server.",
              )
            : err.response?.data?.message ||
                pick("فشل دخول الإدارة.", "Admin login failed."),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPortal
      tone="admin"
      eyebrow={pick("الإدارة", "ADMINISTRATION")}
      title={pick("مركز تحكم أمانك الرقمي.", "Amanak Control Center.")}
      subtitle={pick(
        "إدارة آمنة للطلبة والمغامرات والأسئلة والوسائط والتقارير من مكان واحد.",
        "Securely manage students, adventures, questions, media and reporting from one place.",
      )}
      image={heroesImage}
      imageAlt={pick("أبطال أمانك الرقمي", "Amanak digital safety heroes")}
      features={[
        pick("👥 إدارة الطلبة", "👥 Student management"),
        pick("🧭 إدارة المحتوى", "🧭 Content management"),
        pick("📊 متابعة الأثر", "📊 Learning impact"),
      ]}
      panelEyebrow={pick("دخول آمن", "SECURE ACCESS")}
      panelTitle={pick("تسجيل دخول الإدارة", "Admin Login")}
      panelSubtitle={pick(
        "هذه المساحة مخصصة للمشرفين المخولين فقط.",
        "Authorized administrators only.",
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="admin-email">
            {pick("بريد المشرف", "Admin email")}
          </label>

          <div className="auth-input-wrap has-leading">
            <Mail size={18} />

            <input
              id="admin-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="admin-password">
            {pick("كلمة المرور", "Password")}
          </label>

          <div className="auth-input-wrap has-leading">
            <LockKeyhole size={18} />

            <input
              id="admin-password"
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
          <Link to="/admin/forgot-password">
            {pick("نسيت كلمة المرور؟", "Forgot password?")}
          </Link>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting
            ? pick("جارٍ تسجيل الدخول...", "Signing in...")
            : pick("دخول لوحة الإدارة", "Enter Admin Dashboard")}
        </button>
      </form>

      <div className="auth-security">
        🔐{" "}
        {pick(
          "جلسة إدارة محمية. لا تشارك بيانات الدخول مع أي شخص.",
          "Protected administrator session. Never share admin credentials.",
        )}
      </div>
    </AuthPortal>
  );
}

export default AdminLogin;