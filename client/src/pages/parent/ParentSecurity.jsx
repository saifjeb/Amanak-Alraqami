import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { api } from "../../api/api.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import ParentNav from "../../components/parent/ParentNav.jsx";
import "./ParentSecurity.css";

function ParentSecurity() {
  const navigate = useNavigate();
  const { pick } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [enabledAt, setEnabledAt] = useState(null);
  const [setup, setSetup] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [starting, setStarting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        const response = await api.get("/parent/2fa/status");

        if (!active) {
          return;
        }

        setTwoFactorEnabled(Boolean(response.data?.twoFactorEnabled));

        setEnabledAt(response.data?.twoFactorEnabledAt || null);
      } catch (err) {
        if (!active) {
          return;
        }

        if (err.response?.status === 401) {
          navigate("/parent/login", {
            replace: true,
          });

          return;
        }

        setError(
          err.response?.data?.message ||
            pick(
              "تعذر تحميل إعدادات الأمان.",
              "Could not load security settings.",
            ),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, [navigate, pick]);

  async function startSetup() {
    try {
      setStarting(true);
      setError("");
      setSuccess("");
      setRecoveryCodes([]);

      const response = await api.post("/parent/2fa/setup");

      const setupData = response.data?.setup;

      if (!setupData?.otpauthUrl || !setupData?.manualKey) {
        throw new Error("Invalid two-factor setup response");
      }

      const qrDataUrl = await QRCode.toDataURL(setupData.otpauthUrl, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: "M",
      });

      setSetup(setupData);

      setQrCode(qrDataUrl);

      setToken("");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/parent/login", {
          replace: true,
        });

        return;
      }

      if (err.response?.data?.code === "TWO_FACTOR_ALREADY_ENABLED") {
        setTwoFactorEnabled(true);
        setSetup(null);
        setQrCode("");

        return;
      }

      setError(
        err.response?.data?.message ||
          pick(
            "تعذر بدء إعداد التحقق بخطوتين.",
            "Could not start two-step verification setup.",
          ),
      );
    } finally {
      setStarting(false);
    }
  }

  function handleTokenChange(event) {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);

    setToken(value);
    setError("");
    setSuccess("");
  }

  async function confirmSetup(event) {
    event.preventDefault();

    if (!/^\d{6}$/.test(token)) {
      setError(
        pick(
          "أدخل رمز المصادقة المكون من 6 أرقام.",
          "Enter the 6-digit authenticator code.",
        ),
      );

      return;
    }

    try {
      setConfirming(true);
      setError("");
      setSuccess("");

      const response = await api.post("/parent/2fa/confirm", {
        token,
      });

      const codes = response.data?.recoveryCodes || [];

      setRecoveryCodes(codes);

      setTwoFactorEnabled(true);

      setEnabledAt(new Date().toISOString());

      setSetup(null);
      setQrCode("");
      setToken("");

      setSuccess(
        pick(
          "تم تفعيل التحقق بخطوتين بنجاح. احفظ رموز الاسترداد في مكان آمن.",
          "Two-step verification is now enabled. Save your recovery codes somewhere safe.",
        ),
      );
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/parent/login", {
          replace: true,
        });

        return;
      }

      setError(
        err.response?.data?.message ||
          pick(
            "تعذر تأكيد رمز المصادقة.",
            "Could not confirm the authenticator code.",
          ),
      );
    } finally {
      setConfirming(false);
    }
  }

  async function copyText(value, type) {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(type);

      window.setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch {
      setError(pick("تعذر النسخ تلقائياً.", "Could not copy automatically."));
    }
  }

  async function copyAllRecoveryCodes() {
    if (recoveryCodes.length === 0) {
      return;
    }

    await copyText(recoveryCodes.join("\n"), "recovery");
  }

  if (loading) {
    return (
      <main className="parent-security-page" data-no-auto-translate="true">
        <ParentNav />

        <div className="parent-security-loading">
          <div className="auth-loading-spinner" />

          <p>
            {pick(
              "جارٍ تحميل إعدادات الأمان...",
              "Loading security settings...",
            )}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="parent-security-page" data-no-auto-translate="true">
      <ParentNav />

      <div className="parent-security-container">
        <section className="parent-security-heading">
          <span>{pick("أمان الحساب", "ACCOUNT SECURITY")}</span>

          <h1>{pick("حماية حساب ولي الأمر", "Protect your parent account")}</h1>

          <p>
            {pick(
              "أضف طبقة حماية إضافية باستخدام تطبيق مصادقة مثل Google Authenticator أو Microsoft Authenticator.",
              "Add another layer of protection using an authenticator app such as Google Authenticator or Microsoft Authenticator.",
            )}
          </p>
        </section>

        {error && (
          <div className="parent-security-message error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="parent-security-message success">
            <Check size={18} />

            <span>{success}</span>
          </div>
        )}

        <section className="parent-security-card">
          <div className="parent-security-card-header">
            <div className="parent-security-icon">
              <ShieldCheck size={28} />
            </div>

            <div>
              <span>{pick("التحقق بخطوتين", "TWO-STEP VERIFICATION")}</span>

              <h2>{pick("تطبيق المصادقة", "Authenticator App")}</h2>

              <p>
                {pick(
                  "سيُطلب رمز مؤقت بعد إدخال البريد الإلكتروني وكلمة المرور.",
                  "A temporary code will be required after your email and password.",
                )}
              </p>
            </div>

            <div
              className={`parent-security-status ${
                twoFactorEnabled ? "enabled" : "disabled"
              }`}
            >
              {twoFactorEnabled
                ? pick("مفعّل", "Enabled")
                : pick("غير مفعّل", "Disabled")}
            </div>
          </div>

          {twoFactorEnabled && recoveryCodes.length === 0 && (
            <div className="parent-security-enabled">
              <ShieldCheck size={34} />

              <div>
                <strong>
                  {pick(
                    "حسابك محمي بالتحقق بخطوتين",
                    "Your account is protected with two-step verification",
                  )}
                </strong>

                <p>
                  {pick(
                    "سيتم طلب رمز من تطبيق المصادقة عند تسجيل الدخول.",
                    "Your authenticator code will be required when signing in.",
                  )}
                </p>

                {enabledAt && (
                  <small>
                    {pick("تم التفعيل:", "Enabled:")}{" "}
                    {new Date(enabledAt).toLocaleString()}
                  </small>
                )}
              </div>
            </div>
          )}

          {!twoFactorEnabled && !setup && (
            <div className="parent-security-enable">
              <LockKeyhole size={32} />

              <div>
                <strong>
                  {pick(
                    "فعّل حماية إضافية لحسابك",
                    "Add extra protection to your account",
                  )}
                </strong>

                <p>
                  {pick(
                    "بعد التفعيل لن تكون كلمة المرور وحدها كافية لتسجيل الدخول.",
                    "After enabling it, your password alone will no longer be enough to sign in.",
                  )}
                </p>
              </div>

              <button
                type="button"
                className="parent-security-primary"
                onClick={startSetup}
                disabled={starting}
              >
                <ShieldCheck size={18} />

                {starting
                  ? pick("جارٍ الإعداد...", "Starting...")
                  : pick(
                      "تفعيل التحقق بخطوتين",
                      "Enable Two-Step Verification",
                    )}
              </button>
            </div>
          )}
        </section>

        {!twoFactorEnabled && setup && (
          <section className="parent-security-card parent-security-setup">
            <div className="parent-security-step-heading">
              <span>1</span>

              <div>
                <h2>
                  {pick(
                    "أضف الحساب إلى تطبيق المصادقة",
                    "Add Amanak to your authenticator app",
                  )}
                </h2>

                <p>
                  {pick(
                    "امسح رمز QR باستخدام تطبيق المصادقة على هاتفك.",
                    "Scan this QR code using the authenticator app on your phone.",
                  )}
                </p>
              </div>
            </div>

            <div className="parent-security-qr-layout">
              <div className="parent-security-qr">
                {qrCode && (
                  <img
                    src={qrCode}
                    alt={pick(
                      "رمز QR لإعداد تطبيق المصادقة",
                      "QR code for authenticator setup",
                    )}
                  />
                )}
              </div>

              <div className="parent-security-manual">
                <KeyRound size={24} />

                <strong>
                  {pick("لا يمكنك مسح رمز QR؟", "Can't scan the QR code?")}
                </strong>

                <p>
                  {pick(
                    "أدخل المفتاح التالي يدوياً في تطبيق المصادقة.",
                    "Enter this key manually in your authenticator app.",
                  )}
                </p>

                <div className="parent-security-secret">
                  <code>{setup.manualKey}</code>

                  <button
                    type="button"
                    onClick={() => copyText(setup.manualKey, "manual")}
                    aria-label={pick("نسخ المفتاح", "Copy manual key")}
                  >
                    {copied === "manual" ? (
                      <Check size={17} />
                    ) : (
                      <Copy size={17} />
                    )}
                  </button>
                </div>

                <small>
                  {pick(
                    "لا تشارك هذا المفتاح مع أي شخص.",
                    "Do not share this key with anyone.",
                  )}
                </small>
              </div>
            </div>

            <div className="parent-security-divider" />

            <div className="parent-security-step-heading">
              <span>2</span>

              <div>
                <h2>
                  {pick("أكد رمز المصادقة", "Confirm your authenticator code")}
                </h2>

                <p>
                  {pick(
                    "أدخل الرمز الحالي المكون من 6 أرقام.",
                    "Enter the current 6-digit code.",
                  )}
                </p>
              </div>
            </div>

            <form
              className="parent-security-confirm"
              onSubmit={confirmSetup}
              noValidate
            >
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={token}
                onChange={handleTokenChange}
                maxLength={6}
                placeholder="000000"
                aria-label={pick("رمز المصادقة", "Authenticator code")}
              />

              <button
                type="submit"
                className="parent-security-primary"
                disabled={confirming}
              >
                <ShieldCheck size={18} />

                {confirming
                  ? pick("جارٍ التحقق...", "Verifying...")
                  : pick("تأكيد وتفعيل", "Verify and Enable")}
              </button>
            </form>
          </section>
        )}

        {recoveryCodes.length > 0 && (
          <section className="parent-security-card parent-recovery-card">
            <div className="parent-security-step-heading">
              <span>
                <Check size={18} />
              </span>

              <div>
                <h2>
                  {pick("احفظ رموز الاسترداد", "Save your recovery codes")}
                </h2>

                <p>
                  {pick(
                    "تظهر هذه الرموز الآن فقط. احتفظ بها في مكان آمن لاستخدامها إذا فقدت الوصول إلى تطبيق المصادقة.",
                    "These codes are shown now only. Store them somewhere safe in case you lose access to your authenticator app.",
                  )}
                </p>
              </div>
            </div>

            <div className="parent-recovery-warning">
              {pick(
                "كل رمز صالح للاستخدام مرة واحدة فقط.",
                "Each recovery code can be used only once.",
              )}
            </div>

            <div className="parent-recovery-grid">
              {recoveryCodes.map((code, index) => (
                <code key={code}>
                  {index + 1}. {code}
                </code>
              ))}
            </div>

            <button
              type="button"
              className="parent-security-secondary"
              onClick={copyAllRecoveryCodes}
            >
              {copied === "recovery" ? <Check size={18} /> : <Copy size={18} />}

              {copied === "recovery"
                ? pick("تم النسخ", "Copied")
                : pick("نسخ جميع الرموز", "Copy All Codes")}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

export default ParentSecurity;
