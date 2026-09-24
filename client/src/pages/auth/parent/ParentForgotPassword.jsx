import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import AuthPortal from "../../../components/auth/AuthPortal.jsx";
import { useLanguage } from "../../../i18n/useLanguage.js";
import familyImage from "../../../assets/family-digital-safety.webp";
import "./ParentLogin.css";

function ParentForgotPassword() {
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
        pick("أدخل بريدك الإلكتروني.", "Please enter your email address."),
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      const response = await fetch(`${apiUrl}/api/parent/forgot-password`, {
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
          "إذا كان هذا البريد مرتبطاً بحساب ولي أمر، فسيتم إرسال رابط إعادة تعيين كلمة المرور إليه.",
          "If this email is associated with a parent account, a password reset link will be sent.",
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
      tone="parent"
      eyebrow={pick("استعادة الحساب", "ACCOUNT RECOVERY")}
      title={pick("استعد الوصول إلى حسابك.", "Recover Your Account.")}
      subtitle={pick(
        "أدخل بريدك الإلكتروني وسنرسل رابطاً آمناً لإعادة تعيين كلمة المرور.",
        "Enter your email and we will send a secure password reset link.",
      )}
      image={familyImage}
      imageAlt={pick(
        "عائلة تستخدم التقنية معاً",
        "Family using technology together",
      )}
      features={[
        pick("📧 رابط عبر البريد", "📧 Email reset link"),
        pick("⏱️ صلاحية محدودة", "⏱️ Limited validity"),
        pick("🛡️ حماية الحساب", "🛡️ Account protection"),
      ]}
      panelEyebrow={pick("استعادة آمنة", "SECURE RECOVERY")}
      panelTitle={pick("نسيت كلمة المرور؟", "Forgot Password?")}
      panelSubtitle={pick(
        "أدخل بريد ولي الأمر الإلكتروني للمتابعة.",
        "Enter your parent email to continue.",
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="parent-reset-email">
            {pick("البريد الإلكتروني", "Email address")}
          </label>

          <div className="auth-input-wrap has-leading">
            <Mail size={18} />

            <input
              id="parent-reset-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setSuccess("");
              }}
              autoComplete="email"
              placeholder="parent@example.com"
            />
          </div>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        {success && <div className="auth-success">✅ {success}</div>}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting
            ? pick("جارٍ الإرسال...", "Sending...")
            : pick("إرسال رابط إعادة التعيين", "Send Reset Link")}
        </button>
      </form>

      <div className="auth-secondary">
        <Link to="/parent/login">
          <ArrowLeft size={15} />{" "}
          {pick("العودة إلى تسجيل الدخول", "Back to Parent Login")}
        </Link>
      </div>

      <div className="auth-security">
        🔒{" "}
        {pick(
          "لن نكشف ما إذا كان البريد الإلكتروني مسجلاً أم لا.",
          "For security, we do not reveal whether an email address is registered.",
        )}
      </div>
    </AuthPortal>
  );
}

export default ParentForgotPassword;
