import { useState } from "react";

import {
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import AuthPortal from "../../../components/auth/AuthPortal.jsx";

import { useAuth } from "../../../hooks/useAuth.js";

import { useLanguage } from "../../../i18n/useLanguage.js";

import heroesImage from "../../../assets/amanak-heroes.webp";

import "./AdminLogin.css";

function AdminTwoFactor() {
  const navigate =
    useNavigate();

  const {
    user,
    role,
    loading,
    adminVerifyTwoFactor,
  } = useAuth();

  const { pick } =
    useLanguage();

  const [mode, setMode] =
    useState("totp");

  const [token, setToken] =
    useState("");

  const [
    recoveryCode,
    setRecoveryCode,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  if (loading) {
    return (
      <main className="auth-loading">
        <div className="auth-loading-spinner" />

        <p>
          {pick(
            "جارٍ التحقق...",
            "Checking authentication..."
          )}
        </p>
      </main>
    );
  }

  if (
    user &&
    role === "admin"
  ) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  function handleTokenChange(
    event
  ) {
    const value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setToken(value);
    setError("");
  }

  function handleRecoveryChange(
    event
  ) {
    setRecoveryCode(
      event.target.value
        .toUpperCase()
    );

    setError("");
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      mode === "totp" &&
      !/^\d{6}$/.test(token)
    ) {
      return setError(
        pick(
          "أدخل رمز المصادقة المكون من 6 أرقام.",
          "Enter the 6-digit authenticator code."
        )
      );
    }

    if (
      mode === "recovery" &&
      !recoveryCode.trim()
    ) {
      return setError(
        pick(
          "أدخل رمز الاسترداد.",
          "Enter a recovery code."
        )
      );
    }

    try {
      setSubmitting(true);
      setError("");

      const payload =
        mode === "totp"
          ? {
              token,
            }
          : {
              recoveryCode:
                recoveryCode.trim(),
            };

      await adminVerifyTwoFactor(
        payload
      );

      navigate(
        "/admin/dashboard",
        {
          replace: true,
        }
      );
    } catch (err) {
      const status =
        err.response?.status;

      const code =
        err.response?.data
          ?.code;

      if (
        code ===
          "TWO_FACTOR_CHALLENGE_REQUIRED" ||
        code ===
          "TWO_FACTOR_CHALLENGE_EXPIRED"
      ) {
        setError(
          pick(
            "انتهت جلسة التحقق. سجل الدخول من جديد.",
            "Your verification session expired. Please sign in again."
          )
        );

        return;
      }

      if (status === 429) {
        setError(
          pick(
            "محاولات كثيرة جداً. حاول مرة أخرى لاحقاً.",
            "Too many verification attempts. Try again later."
          )
        );
      } else {
        setError(
          err.response?.data
            ?.message ||
            pick(
              "فشل التحقق من الرمز.",
              "Authentication code verification failed."
            )
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(
    nextMode
  ) {
    setMode(nextMode);
    setError("");
    setToken("");
    setRecoveryCode("");
  }

  return (
    <AuthPortal
      tone="admin"
      eyebrow={pick(
        "حماية الحساب",
        "ACCOUNT SECURITY"
      )}
      title={pick(
        "التحقق بخطوتين",
        "Two-Step Verification"
      )}
      subtitle={pick(
        "استخدم تطبيق المصادقة أو أحد رموز الاسترداد لإكمال تسجيل الدخول.",
        "Use your authenticator app or one of your recovery codes to finish signing in."
      )}
      image={heroesImage}
      imageAlt={pick(
        "أمانك الرقمي",
        "Amanak digital security"
      )}
      features={[
        pick(
          "🔐 حماية إضافية للحساب",
          "🔐 Additional account protection"
        ),
        pick(
          "📱 تطبيق المصادقة",
          "📱 Authenticator app"
        ),
        pick(
          "🛡️ دخول إداري آمن",
          "🛡️ Secure admin access"
        ),
      ]}
      panelEyebrow={pick(
        "الخطوة الثانية",
        "SECOND STEP"
      )}
      panelTitle={pick(
        "تحقق من هويتك",
        "Verify Your Identity"
      )}
      panelSubtitle={pick(
        "أدخل الرمز الحالي من تطبيق المصادقة.",
        "Enter the current code from your authenticator app."
      )}
    >
      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {mode === "totp" ? (
          <div className="auth-field">
            <label htmlFor="admin-2fa-code">
              {pick(
                "رمز المصادقة",
                "Authenticator code"
              )}
            </label>

            <div className="auth-input-wrap has-leading">
              <ShieldCheck
                size={18}
              />

              <input
                id="admin-2fa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={token}
                onChange={
                  handleTokenChange
                }
                maxLength={6}
                placeholder="000000"
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div className="auth-field">
            <label htmlFor="admin-recovery-code">
              {pick(
                "رمز الاسترداد",
                "Recovery code"
              )}
            </label>

            <div className="auth-input-wrap has-leading">
              <KeyRound
                size={18}
              />

              <input
                id="admin-recovery-code"
                type="text"
                value={
                  recoveryCode
                }
                onChange={
                  handleRecoveryChange
                }
                autoComplete="off"
                placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
                autoFocus
              />
            </div>
          </div>
        )}

        {error && (
          <div className="auth-error">
            ⚠️ {error}
          </div>
        )}

        <button
          className="auth-submit"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? pick(
                "جارٍ التحقق...",
                "Verifying..."
              )
            : pick(
                "تحقق وتابع",
                "Verify and Continue"
              )}
        </button>

        <button
          type="button"
          className="auth-submit"
          onClick={() =>
            switchMode(
              mode === "totp"
                ? "recovery"
                : "totp"
            )
          }
          disabled={submitting}
        >
          {mode === "totp"
            ? pick(
                "استخدام رمز استرداد",
                "Use a Recovery Code"
              )
            : pick(
                "استخدام تطبيق المصادقة",
                "Use Authenticator App"
              )}
        </button>
      </form>

      <div className="auth-security">
        🔐{" "}
        {pick(
          "لن يتم منح الوصول إلى لوحة الإدارة حتى ينجح التحقق.",
          "Admin access is granted only after successful verification."
        )}
      </div>

      <div className="auth-forgot-password">
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

export default AdminTwoFactor;