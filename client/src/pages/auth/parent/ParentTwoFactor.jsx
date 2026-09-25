import { useState } from "react";

import { KeyRound, ShieldCheck } from "lucide-react";

import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import AuthPortal from "../../../components/auth/AuthPortal.jsx";

import { useAuth } from "../../../hooks/useAuth.js";

import { useLanguage } from "../../../i18n/useLanguage.js";

import familyImage from "../../../assets/family-digital-safety.webp";

import "./ParentLogin.css";

function ParentTwoFactor() {
  const navigate = useNavigate();

  const location = useLocation();

  const { user, role, loading, parentVerifyTwoFactor } = useAuth();

  const { pick } = useLanguage();

  const [mode, setMode] = useState("totp");

  const [token, setToken] = useState("");

  const [recoveryCode, setRecoveryCode] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  if (loading) {
    return (
      <main className="auth-loading">
        <div className="auth-loading-spinner" />

        <p>{pick("جارٍ التحقق...", "Checking authentication...")}</p>
      </main>
    );
  }

  if (user && role === "parent") {
    return <Navigate to="/parent/dashboard" replace />;
  }

  const from =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/parent/")
      ? location.state.from
      : "/parent/dashboard";

  function handleTokenChange(event) {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);

    setToken(value);

    setError("");
  }

  function handleRecoveryChange(event) {
    setRecoveryCode(event.target.value.toUpperCase());

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (mode === "totp" && !/^\d{6}$/.test(token)) {
      setError(
        pick(
          "أدخل رمز المصادقة المكون من 6 أرقام.",
          "Enter the 6-digit authenticator code.",
        ),
      );

      return;
    }

    if (mode === "recovery" && !recoveryCode.trim()) {
      setError(pick("أدخل رمز الاسترداد.", "Enter a recovery code."));

      return;
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
              recoveryCode: recoveryCode.trim(),
            };

      await parentVerifyTwoFactor(payload);

      navigate(from, {
        replace: true,
      });
    } catch (err) {
      const status = err.response?.status;

      const responseData = err.response?.data;

      if (
        responseData?.code === "TWO_FACTOR_CHALLENGE_REQUIRED" ||
        responseData?.code === "TWO_FACTOR_CHALLENGE_EXPIRED"
      ) {
        setError(
          pick(
            "انتهت جلسة التحقق. سجل الدخول من جديد.",
            "Your verification session expired. Please sign in again.",
          ),
        );

        return;
      }

      if (status === 403 && responseData?.code === "EMAIL_NOT_VERIFIED") {
        navigate("/parent/verify-email", {
          replace: true,
        });

        return;
      }

      if (status === 429) {
        setError(
          pick(
            "محاولات كثيرة جداً. حاول لاحقاً.",
            "Too many verification attempts. Please try later.",
          ),
        );

        return;
      }

      if (status === 400 || status === 401) {
        setError(
          responseData?.message ||
            pick(
              "رمز التحقق غير صحيح أو تم استخدامه مسبقاً.",
              "The verification code is invalid or has already been used.",
            ),
        );

        return;
      }

      setError(
        !err.response
          ? pick(
              "لا يمكن الاتصال بأمانك الآن.",
              "Cannot connect to Amanak right now.",
            )
          : responseData?.message ||
              pick(
                "تعذر التحقق من الرمز.",
                "Could not verify the authentication code.",
              ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);

    setToken("");

    setRecoveryCode("");

    setError("");
  }

  return (
    <AuthPortal
      tone="parent"
      eyebrow={pick("حماية الحساب", "ACCOUNT SECURITY")}
      title={pick("التحقق بخطوتين", "Two-Step Verification")}
      subtitle={pick(
        "أكمل تسجيل الدخول باستخدام تطبيق المصادقة أو أحد رموز الاسترداد.",
        "Finish signing in using your authenticator app or one of your recovery codes.",
      )}
      image={familyImage}
      imageAlt={pick(
        "عائلة تستخدم التقنية بأمان",
        "Family using technology safely",
      )}
      features={[
        pick("🔐 حماية إضافية", "🔐 Extra account protection"),
        pick("📱 تطبيق المصادقة", "📱 Authenticator app"),
        pick("🛡️ حماية بيانات الأسرة", "🛡️ Family data protection"),
      ]}
      panelEyebrow={pick("الخطوة الثانية", "SECOND STEP")}
      panelTitle={pick("تحقق من هويتك", "Verify Your Identity")}
      panelSubtitle={pick(
        mode === "totp"
          ? "أدخل الرمز الحالي من تطبيق المصادقة."
          : "أدخل أحد رموز الاسترداد المحفوظة لديك.",
        mode === "totp"
          ? "Enter the current code from your authenticator app."
          : "Enter one of your saved recovery codes.",
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {mode === "totp" ? (
          <div className="auth-field">
            <label htmlFor="parent-2fa-code">
              {pick("رمز المصادقة", "Authenticator code")}
            </label>

            <div className="auth-input-wrap has-leading">
              <ShieldCheck size={18} />

              <input
                id="parent-2fa-code"
                name="token"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={token}
                onChange={handleTokenChange}
                maxLength={6}
                placeholder="000000"
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div className="auth-field">
            <label htmlFor="parent-recovery-code">
              {pick("رمز الاسترداد", "Recovery code")}
            </label>

            <div className="auth-input-wrap has-leading">
              <KeyRound size={18} />

              <input
                id="parent-recovery-code"
                name="recoveryCode"
                type="text"
                autoComplete="off"
                value={recoveryCode}
                onChange={handleRecoveryChange}
                placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
                autoFocus
              />
            </div>
          </div>
        )}

        {error && <div className="auth-error">⚠️ {error}</div>}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting
            ? pick("جارٍ التحقق...", "Verifying...")
            : pick("تحقق وتابع", "Verify and Continue")}
        </button>

        <button
          type="button"
          className="auth-submit"
          disabled={submitting}
          onClick={() => switchMode(mode === "totp" ? "recovery" : "totp")}
        >
          {mode === "totp"
            ? pick("استخدام رمز استرداد", "Use a Recovery Code")
            : pick("استخدام تطبيق المصادقة", "Use Authenticator App")}
        </button>
      </form>

      <div className="auth-security">
        🔐{" "}
        {pick(
          "لن يتم منح الوصول إلى حساب ولي الأمر حتى ينجح التحقق.",
          "Parent access is granted only after successful verification.",
        )}
      </div>

      <div className="auth-forgot-password">
        <Link to="/parent/login">
          {pick("العودة إلى تسجيل الدخول", "Back to Parent Login")}
        </Link>
      </div>
    </AuthPortal>
  );
}

export default ParentTwoFactor;
