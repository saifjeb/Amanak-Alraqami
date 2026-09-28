import { useEffect, useState } from "react";
import {BellRing,CheckCircle2,Copy,Gauge,KeyRound,Languages,LockKeyhole,Save,Settings2,ShieldAlert,ShieldCheck} from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { api } from "../../api/api.js";
import AdminNav from "../../components/admin/AdminNav.jsx";
import { useLanguage } from "../../i18n/useLanguage.js";
import "./AdminSettings.css";

const SETTINGS_KEY = "amanak-admin-settings";
const defaults = {
  compactMode: false,
  autoRefresh: "off",
  confirmDestructive: true,
  showNotifications: true,
};

function loadSettings() {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
    };
  } catch {
    return defaults;
  }
}

function AdminSettings() {
  const navigate = useNavigate();
  const { language, setLanguage, pick } = useLanguage();
  const [settings, setSettings] = useState(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorEnabledAt, setTwoFactorEnabledAt] = useState(null);
  const [setupPending, setSetupPending] = useState(false);
  const [setup, setSetup] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [startingSetup, setStartingSetup] = useState(false);
  const [confirmingSetup, setConfirmingSetup] = useState(false);
  const [regeneratingCodes, setRegeneratingCodes] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorSuccess, setTwoFactorSuccess] = useState("");
  const [copiedValue, setCopiedValue] = useState("");

  useEffect(() => {
    document.documentElement.dataset.adminDensity = settings.compactMode
      ? "compact"
      : "comfortable";
  }, [settings.compactMode]);

  useEffect(() => {
    let active = true;

    async function loadTwoFactorStatus() {
      try {
        const response = await api.get("/admin/2fa/status");

        if (!active) {
          return;
        }

        setTwoFactorEnabled(Boolean(response.data?.twoFactorEnabled));
        setTwoFactorEnabledAt(response.data?.twoFactorEnabledAt || null);
        setSetupPending(Boolean(response.data?.setupPending));
      } catch (error) {
        if (!active) {
          return;
        }

        if (error.response?.status === 401) {
          navigate("/admin/login", { replace: true });
          return;
        }

        setTwoFactorError(
          error.response?.data?.message ||
            pick(
              "تعذر تحميل حالة التحقق بخطوتين.",
              "Could not load two-factor authentication status.",
            ),
        );
      } finally {
        if (active) {
          setTwoFactorLoading(false);
        }
      }
    }

    loadTwoFactorStatus();

    return () => {
      active = false;
    };
  }, [navigate, pick]);

  function update(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    document.documentElement.dataset.adminDensity = settings.compactMode
      ? "compact"
      : "comfortable";

    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function reset() {
    setSettings(defaults);
    localStorage.removeItem(SETTINGS_KEY);
    document.documentElement.dataset.adminDensity = "comfortable";
    setSaved(false);
  }

  async function startTwoFactorSetup() {
    try {
      setStartingSetup(true);
      setTwoFactorError("");
      setTwoFactorSuccess("");
      setRecoveryCodes([]);

      const response = await api.post("/admin/2fa/setup");

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
      setSetupPending(true);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      if (error.response?.data?.code === "TWO_FACTOR_ALREADY_ENABLED") {
        setTwoFactorEnabled(true);
        setSetup(null);
        setQrCode("");
        setSetupPending(false);
        return;
      }

      setTwoFactorError(
        error.response?.data?.message ||
          pick(
            "تعذر بدء إعداد التحقق بخطوتين.",
            "Could not start two-factor authentication setup.",
          ),
      );
    } finally {
      setStartingSetup(false);
    }
  }

  async function confirmTwoFactorSetup() {
    const cleanToken = token.trim();

    if (!/^\d{6}$/.test(cleanToken)) {
      setTwoFactorError(
        pick(
          "أدخل رمزاً مكوناً من 6 أرقام من تطبيق المصادقة.",
          "Enter the 6-digit code from your authenticator app.",
        ),
      );
      return;
    }

    try {
      setConfirmingSetup(true);
      setTwoFactorError("");
      setTwoFactorSuccess("");

      const response = await api.post("/admin/2fa/confirm", {
        token: cleanToken,
      });

      const codes = Array.isArray(response.data?.recoveryCodes)
        ? response.data.recoveryCodes
        : [];

      setTwoFactorEnabled(true);
      setTwoFactorEnabledAt(new Date().toISOString());
      setSetupPending(false);
      setSetup(null);
      setQrCode("");
      setToken("");
      setRecoveryCodes(codes);
      setTwoFactorSuccess(
        pick(
          "تم تفعيل التحقق بخطوتين بنجاح. احفظ رموز الاسترداد في مكان آمن.",
          "Two-factor authentication is enabled. Save the recovery codes in a secure place.",
        ),
      );
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      setTwoFactorError(
        error.response?.data?.message ||
          pick(
            "تعذر تأكيد رمز التحقق.",
            "Could not confirm the authenticator code.",
          ),
      );
    } finally {
      setConfirmingSetup(false);
    }
  }

  async function regenerateRecoveryCodes() {
    const cleanToken = token.trim();

    if (!/^\d{6}$/.test(cleanToken)) {
      setTwoFactorError(
        pick(
          "أدخل رمزاً جديداً مكوناً من 6 أرقام من تطبيق المصادقة.",
          "Enter a new 6-digit code from your authenticator app.",
        ),
      );
      return;
    }

    try {
      setRegeneratingCodes(true);
      setTwoFactorError("");
      setTwoFactorSuccess("");

      const response = await api.post("/admin/2fa/recovery-codes/regenerate", {
        token: cleanToken,
      });

      const codes = Array.isArray(response.data?.recoveryCodes)
        ? response.data.recoveryCodes
        : [];

      setRecoveryCodes(codes);
      setToken("");
      setTwoFactorSuccess(
        pick(
          "تم إنشاء رموز استرداد جديدة. الرموز السابقة لم تعد صالحة.",
          "New recovery codes were generated. Previous recovery codes are no longer valid.",
        ),
      );
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      setTwoFactorError(
        error.response?.data?.message ||
          pick(
            "تعذر إنشاء رموز استرداد جديدة.",
            "Could not regenerate recovery codes.",
          ),
      );
    } finally {
      setRegeneratingCodes(false);
    }
  }

  async function copyText(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(label);
      window.setTimeout(() => setCopiedValue(""), 1800);
    } catch {
      setTwoFactorError(
        pick("تعذر النسخ إلى الحافظة.", "Could not copy to the clipboard."),
      );
    }
  }

  function formatEnabledAt(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString(language === "ar" ? "ar-JO" : "en-GB");
  }

  return (
    <main className="admin-settings-page" data-no-auto-translate="true">
      <AdminNav />

      <div className="admin-settings-container">
        <section className="admin-page-heading-row">
          <div>
            <span>{pick("تفضيلات الإدارة", "ADMIN PREFERENCES")}</span>

            <h1>{pick("الإعدادات", "Settings")}</h1>

            <p>
              {pick(
                "إعدادات واجهة الإدارة والأمان لهذا الحساب.",
                "Configure admin interface preferences and account security.",
              )}
            </p>
          </div>

          <button type="button" className="settings-save-button" onClick={save}>
            <Save size={18} />
            {pick("حفظ الإعدادات", "Save settings")}
          </button>
        </section>

        {saved && (
          <div className="settings-success">
            <CheckCircle2 size={18} />
            {pick("تم حفظ الإعدادات.", "Settings saved.")}
          </div>
        )}

        <section className="settings-grid">
          <article className="settings-panel">
            <div className="settings-panel-heading">
              <Languages size={22} />

              <div>
                <span>{pick("اللغة", "LANGUAGE")}</span>
                <h2>{pick("لغة لوحة الإدارة", "Admin language")}</h2>
              </div>
            </div>

            <div className="settings-choice-grid">
              <button
                type="button"
                className={language === "ar" ? "active" : ""}
                onClick={() => setLanguage("ar")}
              >
                <strong>العربية</strong>
                <small>RTL</small>
              </button>

              <button
                type="button"
                className={language === "en" ? "active" : ""}
                onClick={() => setLanguage("en")}
              >
                <strong>English</strong>
                <small>LTR</small>
              </button>
            </div>
          </article>

          <article className="settings-panel">
            <div className="settings-panel-heading">
              <Gauge size={22} />

              <div>
                <span>{pick("العرض", "DISPLAY")}</span>
                <h2>{pick("كثافة الواجهة", "Interface density")}</h2>
              </div>
            </div>

            <label className="settings-toggle-row">
              <div>
                <strong>{pick("الوضع المدمج", "Compact mode")}</strong>

                <span>
                  {pick(
                    "تقليل المسافات في لوحة الإدارة.",
                    "Reduce spacing across admin pages.",
                  )}
                </span>
              </div>

              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(event) =>
                  update("compactMode", event.target.checked)
                }
              />
            </label>
          </article>

          <article className="settings-panel">
            <div className="settings-panel-heading">
              <BellRing size={22} />

              <div>
                <span>{pick("التحديث", "REFRESH")}</span>
                <h2>{pick("التحديث التلقائي", "Auto refresh")}</h2>
              </div>
            </div>

            <label className="settings-field">
              <span>{pick("الفاصل الزمني المفضل", "Preferred interval")}</span>

              <select
                value={settings.autoRefresh}
                onChange={(event) => update("autoRefresh", event.target.value)}
              >
                <option value="off">{pick("إيقاف", "Off")}</option>
                <option value="30">30 {pick("ثانية", "seconds")}</option>
                <option value="60">60 {pick("ثانية", "seconds")}</option>
                <option value="300">5 {pick("دقائق", "minutes")}</option>
              </select>
            </label>

            <label className="settings-toggle-row settings-toggle-secondary">
              <div>
                <strong>{pick("إظهار الإشعارات", "Show notifications")}</strong>

                <span>
                  {pick(
                    "إظهار رسائل النجاح والتحذير.",
                    "Show success and warning messages.",
                  )}
                </span>
              </div>

              <input
                type="checkbox"
                checked={settings.showNotifications}
                onChange={(event) =>
                  update("showNotifications", event.target.checked)
                }
              />
            </label>
          </article>

          <article className="settings-panel">
            <div className="settings-panel-heading">
              <ShieldAlert size={22} />

              <div>
                <span>{pick("السلامة", "SAFETY")}</span>
                <h2>
                  {pick(
                    "تأكيد الإجراءات الخطرة",
                    "Destructive action confirmation",
                  )}
                </h2>
              </div>
            </div>

            <label className="settings-toggle-row">
              <div>
                <strong>{pick("طلب تأكيد", "Require confirmation")}</strong>

                <span>
                  {pick(
                    "الاحتفاظ بالتأكيد قبل الحذف والتعطيل.",
                    "Keep confirmation before delete and disable actions.",
                  )}
                </span>
              </div>

              <input
                type="checkbox"
                checked={settings.confirmDestructive}
                onChange={(event) =>
                  update("confirmDestructive", event.target.checked)
                }
              />
            </label>
          </article>

          <article className="settings-panel settings-2fa-panel">
            <div className="settings-panel-heading">
              <ShieldCheck size={22} />

              <div>
                <span>{pick("الأمان", "SECURITY")}</span>
                <h2>{pick("التحقق بخطوتين", "Two-factor authentication")}</h2>
              </div>
            </div>

            {twoFactorLoading ? (
              <div className="settings-2fa-loading">
                {pick(
                  "جارٍ تحميل حالة الأمان...",
                  "Loading security status...",
                )}
              </div>
            ) : (
              <>
                <div className="settings-2fa-status-row">
                  <div>
                    <strong>
                      {twoFactorEnabled
                        ? pick("مفعّل", "Enabled")
                        : pick("غير مفعّل", "Not enabled")}
                    </strong>

                    <span>
                      {twoFactorEnabled
                        ? pick(
                            "سيُطلب رمز من تطبيق المصادقة عند تسجيل الدخول.",
                            "An authenticator code will be required when signing in.",
                          )
                        : pick(
                            "أضف طبقة حماية إضافية لحساب الإدارة.",
                            "Add an extra layer of protection to the admin account.",
                          )}
                    </span>

                    {twoFactorEnabledAt && (
                      <small>
                        {pick("تم التفعيل:", "Enabled:")}{" "}
                        {formatEnabledAt(twoFactorEnabledAt)}
                      </small>
                    )}

                    {!twoFactorEnabled && setupPending && !setup && (
                      <small>
                        {pick(
                          "يوجد إعداد غير مكتمل. ابدأ الإعداد مرة أخرى لإنشاء رمز جديد.",
                          "A setup is pending. Start setup again to create a fresh code.",
                        )}
                      </small>
                    )}
                  </div>

                  <span
                    className={`settings-2fa-badge ${
                      twoFactorEnabled ? "enabled" : "disabled"
                    }`}
                  >
                    {twoFactorEnabled
                      ? pick("مفعّل", "Enabled")
                      : pick("غير مفعّل", "Disabled")}
                  </span>
                </div>

                {twoFactorError && (
                  <div className="settings-2fa-message error">
                    {twoFactorError}
                  </div>
                )}

                {twoFactorSuccess && (
                  <div className="settings-2fa-message success">
                    <CheckCircle2 size={17} />
                    {twoFactorSuccess}
                  </div>
                )}

                {!twoFactorEnabled && !setup && (
                  <button
                    type="button"
                    className="settings-2fa-primary-button"
                    onClick={startTwoFactorSetup}
                    disabled={startingSetup}
                  >
                    <LockKeyhole size={17} />
                    {startingSetup
                      ? pick("جارٍ إنشاء الإعداد...", "Creating setup...")
                      : pick(
                          "تفعيل التحقق بخطوتين",
                          "Enable two-factor authentication",
                        )}
                  </button>
                )}

                {!twoFactorEnabled && setup && (
                  <div className="settings-2fa-setup">
                    <div className="settings-2fa-setup-grid">
                      <div className="settings-2fa-qr">
                        {qrCode && (
                          <img
                            src={qrCode}
                            alt={pick(
                              "رمز QR للتحقق بخطوتين",
                              "Two-factor authentication QR code",
                            )}
                          />
                        )}
                      </div>

                      <div className="settings-2fa-instructions">
                        <h3>
                          {pick(
                            "اربط تطبيق المصادقة",
                            "Connect your authenticator app",
                          )}
                        </h3>

                        <p>
                          {pick(
                            "امسح رمز QR باستخدام Google Authenticator أو Microsoft Authenticator أو تطبيق متوافق.",
                            "Scan the QR code using Google Authenticator, Microsoft Authenticator, or another compatible app.",
                          )}
                        </p>

                        <div className="settings-2fa-manual-key">
                          <span>
                            {pick("مفتاح الإدخال اليدوي", "Manual setup key")}
                          </span>

                          <code>{setup.manualKey}</code>

                          <button
                            type="button"
                            onClick={() =>
                              copyText(setup.manualKey, "manual-key")
                            }
                          >
                            <Copy size={15} />
                            {copiedValue === "manual-key"
                              ? pick("تم النسخ", "Copied")
                              : pick("نسخ", "Copy")}
                          </button>
                        </div>
                      </div>
                    </div>

                    <label className="settings-2fa-token-field">
                      <span>
                        {pick("رمز تطبيق المصادقة", "Authenticator code")}
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={token}
                        onChange={(event) =>
                          setToken(event.target.value.replace(/\D/g, ""))
                        }
                        placeholder="000000"
                      />
                    </label>

                    <div className="settings-2fa-actions">
                      <button
                        type="button"
                        className="settings-2fa-primary-button"
                        onClick={confirmTwoFactorSetup}
                        disabled={confirmingSetup}
                      >
                        <ShieldCheck size={17} />
                        {confirmingSetup
                          ? pick("جارٍ التحقق...", "Verifying...")
                          : pick("تأكيد وتفعيل", "Confirm and enable")}
                      </button>

                      <button
                        type="button"
                        className="settings-2fa-secondary-button"
                        onClick={startTwoFactorSetup}
                        disabled={startingSetup}
                      >
                        {pick("إنشاء رمز QR جديد", "Generate new QR code")}
                      </button>
                    </div>
                  </div>
                )}

                {twoFactorEnabled && (
                  <div className="settings-2fa-recovery-section">
                    <div className="settings-2fa-recovery-heading">
                      <KeyRound size={18} />

                      <div>
                        <strong>
                          {pick("رموز الاسترداد", "Recovery codes")}
                        </strong>

                        <span>
                          {pick(
                            "يمكن استخدام رمز استرداد إذا لم تتمكن من الوصول إلى تطبيق المصادقة.",
                            "Use a recovery code if you cannot access your authenticator app.",
                          )}
                        </span>
                      </div>
                    </div>

                    <label className="settings-2fa-token-field">
                      <span>
                        {pick(
                          "رمز المصادقة لإنشاء رموز جديدة",
                          "Authenticator code to generate new recovery codes",
                        )}
                      </span>

                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={token}
                        onChange={(event) =>
                          setToken(event.target.value.replace(/\D/g, ""))
                        }
                        placeholder="000000"
                      />
                    </label>

                    <button
                      type="button"
                      className="settings-2fa-secondary-button"
                      onClick={regenerateRecoveryCodes}
                      disabled={regeneratingCodes}
                    >
                      <KeyRound size={16} />
                      {regeneratingCodes
                        ? pick("جارٍ إنشاء الرموز...", "Generating codes...")
                        : pick(
                            "إنشاء رموز استرداد جديدة",
                            "Generate new recovery codes",
                          )}
                    </button>
                  </div>
                )}

                {recoveryCodes.length > 0 && (
                  <div className="settings-recovery-box">
                    <div className="settings-recovery-warning">
                      <ShieldAlert size={18} />

                      <div>
                        <strong>
                          {pick("احفظ هذه الرموز الآن", "Save these codes now")}
                        </strong>

                        <span>
                          {pick(
                            "تظهر هذه الرموز الآن فقط. خزّنها في مكان آمن ولا تشاركها مع أي شخص.",
                            "These codes are shown now. Store them securely and never share them.",
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="settings-recovery-grid">
                      {recoveryCodes.map((code, index) => (
                        <code key={`${code}-${index}`}>{code}</code>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="settings-2fa-secondary-button"
                      onClick={() =>
                        copyText(recoveryCodes.join("\n"), "recovery-codes")
                      }
                    >
                      <Copy size={16} />
                      {copiedValue === "recovery-codes"
                        ? pick("تم النسخ", "Copied")
                        : pick("نسخ جميع الرموز", "Copy all codes")}
                    </button>
                  </div>
                )}
              </>
            )}
          </article>
        </section>

        <section className="settings-footer-panel">
          <div>
            <Settings2 size={22} />

            <div>
              <strong>{pick("إعدادات محلية", "Local preferences")}</strong>

              <p>
                {pick(
                  "يتم حفظ إعدادات العرض والواجهة في هذا المتصفح. إعدادات التحقق بخطوتين محفوظة بأمان على الخادم.",
                  "Display preferences are stored in this browser. Two-factor authentication settings are stored securely on the server.",
                )}
              </p>
            </div>
          </div>

          <button type="button" onClick={reset}>
            {pick("إعادة الضبط", "Reset defaults")}
          </button>
        </section>
      </div>
    </main>
  );
}

export default AdminSettings;