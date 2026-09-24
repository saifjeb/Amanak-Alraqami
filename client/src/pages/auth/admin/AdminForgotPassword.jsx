import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import AuthPortal from "../../../components/auth/AuthPortal.jsx";
import { useLanguage } from "../../../i18n/useLanguage.js";
import heroesImage from "../../../assets/amanak-heroes.webp";
import "./AdminLogin.css";

function AdminForgotPassword() {
  const { pick } = useLanguage();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        pick("أدخل بريد المشرف الإلكتروني.", "Please enter your admin email."),
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      const response = await fetch(`${apiUrl}/api/admin/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok && response.status === 429) {
        throw new Error(
          pick(
            "تم إرسال طلبات كثيرة. حاول مرة أخرى لاحقاً.",
            "Too many requests. Please try again later.",
          ),
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            pick(
              "تعذر إرسال طلب إعادة تعيين كلمة المرور.",
              "Unable to process the password reset request.",
            ),
        );
      }

      setSuccess(
        pick(
          "إذا كان هذا البريد مرتبطاً بحساب مشرف، فسيتم إرسال رابط إعادة تعيين كلمة المرور إليه.",
          "If this email is associated with an administrator account, a password reset link will be sent.",
        ),
      );
    } catch (err) {
      setError(
        err.message ||
          pick(
            "حدث خطأ. حاول مرة أخرى.",
            "Something went wrong. Please try again.",
          ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPortal
      tone="admin"
      eyebrow={pick("استعادة الحساب", "ACCOUNT RECOVERY")}
      title={pick("استعادة وصول المشرف.", "Recover Admin Access.")}
      subtitle={pick(
        "أدخل بريد المشرف وسنرسل رابطاً آمناً لإعادة تعيين كلمة المرور.",
        "Enter your administrator email and we will send a secure password reset link.",
      )}
      image={heroesImage}
      imageAlt={pick("أبطال أمانك الرقمي", "Amanak digital safety heroes")}
      features={[
        pick("🔐 رابط آمن", "🔐 Secure reset link"),
        pick("⏱️ صلاحية محدودة", "⏱️ Limited validity"),
        pick("🛡️ حماية الحساب", "🛡️ Account protection"),
      ]}
      panelEyebrow={pick("استعادة آمنة", "SECURE RECOVERY")}
      panelTitle={pick("نسيت كلمة المرور؟", "Forgot Password?")}
      panelSubtitle={pick(
        "أدخل بريد المشرف الإلكتروني للمتابعة.",
        "Enter your admin email to continue.",
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="admin-reset-email">
            {pick("بريد المشرف", "Admin email")}
          </label>

          <div className="auth-input-wrap has-leading">
            <Mail size={18} />

            <input
              id="admin-reset-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setSuccess("");
              }}
              autoComplete="email"
              placeholder="admin@example.com"
            />
          </div>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        {success && <div className="auth-success">✅ {success}</div>}

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting
            ? pick("جارٍ الإرسال...", "Sending...")
            : pick("إرسال رابط إعادة التعيين", "Send Reset Link")}
        </button>
      </form>

      <div className="auth-secondary">
        <Link to="/admin/login">
          <ArrowLeft size={15} />{" "}
          {pick("العودة إلى تسجيل الدخول", "Back to Admin Login")}
        </Link>
      </div>

      <div className="auth-security">
        🔐{" "}
        {pick(
          "لن نكشف ما إذا كان البريد الإلكتروني مسجلاً أم لا.",
          "For security, we do not reveal whether an email address is registered.",
        )}
      </div>
    </AuthPortal>
  );
}

export default AdminForgotPassword;
