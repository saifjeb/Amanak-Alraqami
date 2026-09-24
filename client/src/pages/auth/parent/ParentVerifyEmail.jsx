import { useEffect, useState } from "react";
import { BadgeCheck, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthPortal from "../../../components/auth/AuthPortal.jsx";
import { useLanguage } from "../../../i18n/useLanguage.js";
import familyImage from "../../../assets/family-digital-safety.webp";
import "./ParentLogin.css";

function ParentVerifyEmail() {
  const { pick } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail =
    typeof location.state?.email === "string" ? location.state.email : "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [resending, setResending] = useState(false);

  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, [cooldown]);

  function handleCodeChange(e) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);

    setCode(value);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError(
        pick(
          "أدخل بريداً إلكترونياً صحيحاً.",
          "Please enter a valid email address.",
        ),
      );

      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError(
        pick(
          "أدخل رمز التحقق المكون من 6 أرقام.",
          "Enter the 6-digit verification code.",
        ),
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      setResendMessage("");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      const response = await fetch(`${apiUrl}/api/parent/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          code,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            data.message ||
              pick(
                "محاولات كثيرة جداً. حاول لاحقاً.",
                "Too many verification attempts. Please try again later.",
              ),
          );
        }

        throw new Error(
          data.message ||
            pick(
              "رمز التحقق غير صحيح أو منتهي الصلاحية.",
              "Invalid or expired verification code.",
            ),
        );
      }

      setSuccess(
        pick(
          "تم التحقق من بريدك الإلكتروني بنجاح.",
          "Your email has been verified successfully.",
        ),
      );

      setTimeout(() => {
        navigate("/parent/login", {
          replace: true,
          state: {
            email: normalizedEmail,
            emailVerified: true,
          },
        });
      }, 1600);
    } catch (err) {
      setError(
        err.message ||
          pick(
            "تعذر التحقق من البريد الإلكتروني.",
            "Could not verify your email.",
          ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError(
        pick(
          "أدخل بريداً إلكترونياً صحيحاً.",
          "Please enter a valid email address.",
        ),
      );

      return;
    }

    try {
      setResending(true);
      setError("");
      setSuccess("");
      setResendMessage("");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      const response = await fetch(
        `${apiUrl}/api/parent/resend-verification-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            data.message ||
              pick(
                "تم طلب رموز كثيرة. حاول مرة أخرى لاحقاً.",
                "Too many code requests. Please try again later.",
              ),
          );
        }

        throw new Error(
          data.message ||
            pick(
              "تعذر إرسال رمز جديد.",
              "Could not send a new verification code.",
            ),
        );
      }

      setCode("");

      setResendMessage(
        pick(
          "تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.",
          "A new verification code has been sent to your email.",
        ),
      );

      setCooldown(60);
    } catch (err) {
      setError(
        err.message ||
          pick(
            "تعذر إرسال رمز جديد.",
            "Could not send a new verification code.",
          ),
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthPortal
      tone="parent"
      eyebrow={pick("خطوة أخيرة", "ONE MORE STEP")}
      title={pick("تحقق من بريدك الإلكتروني", "Verify Email")}
      subtitle={pick(
        "أدخل بريدك الإلكتروني ورمز التحقق الذي استلمته.",
        "Enter your email and the verification code you received.",
      )}
      image={familyImage}
      imageAlt="Family"
      features={[
        pick("📧 تحقق من البريد", "📧 Email verification"),
        pick("🔐 رمز آمن", "🔐 Secure code"),
        pick("⏱️ صالح لمدة 10 دقائق", "⏱️ Valid for 10 minutes"),
      ]}
      panelEyebrow={pick("خطوة أخيرة", "ONE MORE STEP")}
      panelTitle={pick("تحقق من البريد", "Verify Email")}
      panelSubtitle={pick(
        "أدخل بريدك الإلكتروني ورمز التحقق الذي استلمته.",
        "Enter your email and the verification code you received.",
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="verify-email">
            {pick("البريد الإلكتروني", "Email address")}
          </label>

          <div className="auth-input-wrap has-leading">
            <Mail size={18} />

            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setResendMessage("");
              }}
              autoComplete="email"
              placeholder="parent@example.com"
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="verification-code">
            {pick("رمز التحقق", "Verification code")}
          </label>

          <div className="auth-input-wrap has-leading">
            <BadgeCheck size={18} />

            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
            />
          </div>
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        {success && <div className="auth-success">✅ {success}</div>}

        {resendMessage && (
          <div className="auth-success">✅ {resendMessage}</div>
        )}

        <button
          className="auth-submit"
          type="submit"
          disabled={submitting || code.length !== 6}
        >
          {submitting
            ? pick("جارٍ التحقق...", "Verifying...")
            : pick("تحقق من البريد", "Verify Email")}
        </button>
      </form>

      <div className="auth-resend">
        <span>{pick("لم يصلك الرمز؟", "Didn't receive the code?")}</span>

        <button
          type="button"
          className="auth-resend-button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
        >
          {resending
            ? pick("جارٍ الإرسال...", "Sending...")
            : cooldown > 0
              ? pick(
                  `إعادة الإرسال خلال ${cooldown} ثانية`,
                  `Resend in ${cooldown}s`,
                )
              : pick("إعادة إرسال الرمز", "Resend Code")}
        </button>
      </div>

      <div className="auth-secondary">
        {pick("تم التحقق بالفعل؟", "Already verified?")}{" "}
        <Link to="/parent/login">{pick("سجّل الدخول", "Sign in")}</Link>
      </div>

      <div className="auth-security">
        🔒{" "}
        {pick(
          "رمز التحقق صالح لمدة 10 دقائق ويمكن استخدامه مرة واحدة فقط.",
          "The verification code is valid for 10 minutes and can only be used once.",
        )}
      </div>
    </AuthPortal>
  );
}

export default ParentVerifyEmail;
