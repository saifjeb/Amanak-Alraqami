import { useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import AuthPortal from "../../../components/auth/AuthPortal.jsx";
import { useLanguage } from "../../../i18n/useLanguage.js";
import heroesImage from "../../../assets/amanak-heroes.webp";
import "./AdminLogin.css";

function AdminResetPassword() {
  const { pick } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!token) {
      setError(
        pick(
          "رابط إعادة تعيين كلمة المرور غير صالح.",
          "The password reset link is invalid."
        )
      );
      return;
    }

    if (form.password.length < 8) {
      setError(
        pick(
          "كلمة المرور يجب أن تكون 8 أحرف على الأقل.",
          "Password must be at least 8 characters."
        )
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(
        pick(
          "كلمتا المرور غير متطابقتين.",
          "Passwords do not match."
        )
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const apiUrl =
        import.meta.env.VITE_API_URL ||
        "http://localhost:3000";

      const response = await fetch(
        `${apiUrl}/api/admin/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password: form.password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            pick(
              "تعذر إعادة تعيين كلمة المرور.",
              "Unable to reset password."
            )
        );
      }

      setSuccess(
        pick(
          "تم تغيير كلمة المرور بنجاح.",
          "Your password has been reset successfully."
        )
      );

      setTimeout(() => {
        navigate("/admin/login", {
          replace: true,
        });
      }, 1800);
    } catch (err) {
      setError(
        err.message ||
          pick(
            "حدث خطأ. حاول مرة أخرى.",
            "Something went wrong. Please try again."
          )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPortal
      tone="admin"
      eyebrow={pick(
        "إعادة تعيين كلمة المرور",
        "PASSWORD RESET"
      )}
      title={pick(
        "أنشئ كلمة مرور جديدة.",
        "Create a New Password."
      )}
      subtitle={pick(
        "اختر كلمة مرور جديدة وآمنة لحساب المشرف.",
        "Choose a new secure password for your administrator account."
      )}
      image={heroesImage}
      imageAlt={pick(
        "أبطال أمانك الرقمي",
        "Amanak digital safety heroes"
      )}
      features={[
        pick(
          "🔐 كلمة مرور جديدة",
          "🔐 New password"
        ),
        pick(
          "🛡️ حماية الحساب",
          "🛡️ Account protection"
        ),
        pick(
          "✅ تأكيد آمن",
          "✅ Secure confirmation"
        ),
      ]}
      panelEyebrow={pick(
        "تحديث آمن",
        "SECURE UPDATE"
      )}
      panelTitle={pick(
        "إعادة تعيين كلمة المرور",
        "Reset Password"
      )}
      panelSubtitle={pick(
        "أدخل كلمة المرور الجديدة مرتين.",
        "Enter your new password twice."
      )}
    >
      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="auth-field">
          <label htmlFor="admin-new-password">
            {pick(
              "كلمة المرور الجديدة",
              "New password"
            )}
          </label>

          <div className="auth-input-wrap has-leading">
            <LockKeyhole size={18} />

            <input
              id="admin-new-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />

            <button
              type="button"
              className="auth-password-toggle"
              onClick={() =>
                setShowPassword((value) => !value)
              }
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="admin-confirm-password">
            {pick(
              "تأكيد كلمة المرور",
              "Confirm password"
            )}
          </label>

          <div className="auth-input-wrap has-leading">
            <LockKeyhole size={18} />

            <input
              id="admin-confirm-password"
              name="confirmPassword"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />

            <button
              type="button"
              className="auth-password-toggle"
              onClick={() =>
                setShowConfirmPassword(
                  (value) => !value
                )
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="auth-error">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="auth-success">
            ✅ {success}
          </div>
        )}

        <button
          type="submit"
          className="auth-submit"
          disabled={submitting}
        >
          {submitting
            ? pick(
                "جارٍ التحديث...",
                "Updating..."
              )
            : pick(
                "تغيير كلمة المرور",
                "Reset Password"
              )}
        </button>
      </form>

      <div className="auth-secondary">
        <Link to="/admin/login">
          {pick(
            "العودة إلى تسجيل الدخول",
            "Back to Admin Login"
          )}
        </Link>
      </div>
    </AuthPortal>
  );
}

export default AdminResetPassword;