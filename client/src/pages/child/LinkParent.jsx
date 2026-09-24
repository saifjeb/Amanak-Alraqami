import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  Link2,
  ShieldCheck,
  Smartphone,
  UsersRound,
} from "lucide-react";
import { api } from "../../api/api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import ChildNav from "../../components/child/ChildNav.jsx";
import AvatarPortrait from "../../components/common/AvatarPortrait.jsx";
import "./LinkParent.css";

function LinkParent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isArabic, pick } = useLanguage();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  function handleCodeChange(event) {
    setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError(
        pick(
          "أدخل الرمز المكون من 6 أرقام الذي أعطاك إياه ولي أمرك.",
          "Enter the 6-digit code from your parent.",
        ),
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.post("/parent/link", { code });
      setSuccess(
        response.data?.message ||
          pick("تم ربط ولي الأمر بنجاح.", "Parent linked successfully."),
      );
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        navigate("/child/login", { replace: true });
      } else if (status === 404) {
        setError(pick("رمز الربط غير موجود.", "Link code not found."));
      } else if (status === 409) {
        setError(
          pick(
            "تم استخدام رمز الربط هذا مسبقاً.",
            "This link code has already been used.",
          ),
        );
      } else if (status === 410) {
        setError(
          pick(
            "انتهت صلاحية الرمز. اطلب من ولي أمرك رمزاً جديداً.",
            "This link code has expired. Ask your parent for a new one.",
          ),
        );
      } else if (status === 429) {
        setError(
          pick(
            "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.",
            "Too many attempts. Please wait before trying again.",
          ),
        );
      } else {
        setError(
          err.response?.data?.message ||
            pick("تعذر ربط ولي الأمر.", "Could not link your parent."),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="link-parent-page" data-no-auto-translate="true">
      <ChildNav />

      <div className="link-parent-container">
        <div className="link-parent-page-heading">
          <div>
            <span>{pick("العائلة والأمان", "FAMILY & SAFETY")}</span>
            <h1>{pick("ربط حساب ولي الأمر", "Connect with Parent")}</h1>
            <p>
              {pick(
                "اربط حسابك بطريقة آمنة ليتمكن ولي أمرك من متابعة تقدمك ودعم تعلمك.",
                "Connect safely so your parent can follow your progress and support your learning.",
              )}
            </p>
          </div>
          <Link to="/child/profile" className="link-parent-back">
            <Arrow size={17} />
            {pick("العودة إلى ملفي", "Back to Profile")}
          </Link>
        </div>

        <section className="link-parent-layout">
          <article className="link-parent-guide">
            <div className="link-parent-guide-hero">
              <div className="link-parent-student-avatar">
                <AvatarPortrait
                  avatar={user?.avatar}
                  size="lg"
                  alt={user?.nickname || pick("شخصيتي", "My avatar")}
                />
              </div>
              <div>
                <span>{pick("مرحباً", "HELLO")}</span>
                <h2>{user?.nickname || pick("مستكشف", "Explorer")}</h2>
                <p>{pick("لنربط حسابك بالعائلة بأمان.", "Let’s connect your account with family safely.")}</p>
              </div>
            </div>

            <div className="link-parent-steps">
              <div>
                <span className="link-step-number">1</span>
                <span className="link-step-icon"><UsersRound size={20} /></span>
                <div>
                  <strong>{pick("ولي أمرك يسجل الدخول", "Parent signs in")}</strong>
                  <p>{pick("يدخل ولي أمرك إلى لوحة التحكم الخاصة به.", "Your parent opens their Amanak dashboard.")}</p>
                </div>
              </div>
              <div>
                <span className="link-step-number">2</span>
                <span className="link-step-icon"><KeyRound size={20} /></span>
                <div>
                  <strong>{pick("ينشئ رمزاً مؤقتاً", "They generate a code")}</strong>
                  <p>{pick("يظهر رمز آمن مكوّن من 6 أرقام لفترة محدودة.", "A secure 6-digit code is created for a short time.")}</p>
                </div>
              </div>
              <div>
                <span className="link-step-number">3</span>
                <span className="link-step-icon"><Link2 size={20} /></span>
                <div>
                  <strong>{pick("أدخل الرمز هنا", "Enter it here")}</strong>
                  <p>{pick("بعد الربط سيتمكن ولي أمرك من متابعة تقدمك فقط.", "Once linked, your parent can view and support your progress.")}</p>
                </div>
              </div>
            </div>

            <div className="link-parent-privacy-note">
              <ShieldCheck size={21} />
              <p>
                {pick(
                  "لا تشارك رمز الربط مع أي شخص آخر. استخدم فقط رمزاً أعطاك إياه ولي أمرك أو الوصي عليك مباشرة.",
                  "Never share the link code with anyone else. Only use a code given directly by your parent or guardian.",
                )}
              </p>
            </div>
          </article>

          <article className="link-parent-form-card">
            {!success ? (
              <>
                <div className="link-parent-form-icon"><Smartphone size={30} /></div>
                <span className="link-parent-form-label">{pick("رمز الربط", "LINK CODE")}</span>
                <h2>{pick("أدخل رمز ولي الأمر", "Enter Parent Code")}</h2>
                <p>
                  {pick(
                    "اطلب من ولي أمرك إنشاء رمز من لوحة التحكم ثم أدخل الأرقام الستة أدناه.",
                    "Ask your parent to generate a code from their dashboard, then enter all six digits below.",
                  )}
                </p>

                <form onSubmit={handleSubmit}>
                  <label htmlFor="link-code">{pick("رمز ولي الأمر", "Parent Link Code")}</label>
                  <div className="link-code-wrap">
                    <input
                      id="link-code"
                      value={code}
                      onChange={handleCodeChange}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={6}
                      disabled={loading}
                      aria-describedby="link-code-help"
                    />
                    <span className="link-code-counter">{code.length}/6</span>
                  </div>
                  <small id="link-code-help" className="link-code-help">
                    <Clock3 size={13} />
                    {pick("الرمز مؤقت، استخدمه فور استلامه.", "The code is temporary, so use it as soon as you receive it.")}
                  </small>

                  {error && <div className="link-parent-error">⚠️ {error}</div>}

                  <button type="submit" disabled={loading || code.length !== 6}>
                    {loading ? pick("جارٍ الربط...", "Connecting...") : pick("ربط الحساب", "Connect Parent")}
                    {!loading && <Arrow size={18} />}
                  </button>
                </form>
              </>
            ) : (
              <div className="link-parent-success-state">
                <span className="link-parent-success-icon"><CheckCircle2 size={42} /></span>
                <span>{pick("تم الربط", "CONNECTED")}</span>
                <h2>{pick("تم ربط ولي الأمر بنجاح!", "Parent connected successfully!")}</h2>
                <p>{success}</p>
                <Link to="/child/dashboard" className="link-parent-done">
                  {pick("العودة إلى لوحة التحكم", "Return to Dashboard")}
                  <Arrow size={18} />
                </Link>
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

export default LinkParent;
