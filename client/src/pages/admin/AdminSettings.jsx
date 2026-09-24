import { useEffect, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Gauge,
  Languages,
  Save,
  Settings2,
  ShieldAlert,
} from "lucide-react";
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
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return defaults;
  }
}

function AdminSettings() {
  const { language, setLanguage, pick } = useLanguage();
  const [settings, setSettings] = useState(() => loadSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.adminDensity = settings.compactMode ? "compact" : "comfortable";
  }, [settings.compactMode]);

  function update(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.dataset.adminDensity = settings.compactMode ? "compact" : "comfortable";
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function reset() {
    setSettings(defaults);
    localStorage.removeItem(SETTINGS_KEY);
    document.documentElement.dataset.adminDensity = "comfortable";
    setSaved(false);
  }

  return (
    <main className="admin-settings-page" data-no-auto-translate="true">
      <AdminNav />
      <div className="admin-settings-container">
        <section className="admin-page-heading-row">
          <div>
            <span>{pick("تفضيلات الإدارة", "ADMIN PREFERENCES")}</span>
            <h1>{pick("الإعدادات", "Settings")}</h1>
            <p>{pick("إعدادات واجهة الإدارة المحلية لهذا المتصفح.", "Configure local admin preferences for this browser.")}</p>
          </div>
          <button type="button" className="settings-save-button" onClick={save}><Save size={18} />{pick("حفظ الإعدادات", "Save settings")}</button>
        </section>

        {saved && <div className="settings-success"><CheckCircle2 size={18} />{pick("تم حفظ الإعدادات.", "Settings saved.")}</div>}

        <section className="settings-grid">
          <article className="settings-panel">
            <div className="settings-panel-heading"><Languages size={22} /><div><span>{pick("اللغة", "LANGUAGE")}</span><h2>{pick("لغة لوحة الإدارة", "Admin language")}</h2></div></div>
            <div className="settings-choice-grid">
              <button type="button" className={language === "ar" ? "active" : ""} onClick={() => setLanguage("ar")}><strong>العربية</strong><small>RTL</small></button>
              <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}><strong>English</strong><small>LTR</small></button>
            </div>
          </article>

          <article className="settings-panel">
            <div className="settings-panel-heading"><Gauge size={22} /><div><span>{pick("العرض", "DISPLAY")}</span><h2>{pick("كثافة الواجهة", "Interface density")}</h2></div></div>
            <label className="settings-toggle-row">
              <div><strong>{pick("الوضع المدمج", "Compact mode")}</strong><span>{pick("تقليل المسافات في لوحة الإدارة.", "Reduce spacing across admin pages.")}</span></div>
              <input type="checkbox" checked={settings.compactMode} onChange={(event) => update("compactMode", event.target.checked)} />
            </label>
          </article>

          <article className="settings-panel">
            <div className="settings-panel-heading"><BellRing size={22} /><div><span>{pick("التحديث", "REFRESH")}</span><h2>{pick("التحديث التلقائي", "Auto refresh")}</h2></div></div>
            <label className="settings-field">
              <span>{pick("الفاصل الزمني المفضل", "Preferred interval")}</span>
              <select value={settings.autoRefresh} onChange={(event) => update("autoRefresh", event.target.value)}>
                <option value="off">{pick("إيقاف", "Off")}</option>
                <option value="30">30 {pick("ثانية", "seconds")}</option>
                <option value="60">60 {pick("ثانية", "seconds")}</option>
                <option value="300">5 {pick("دقائق", "minutes")}</option>
              </select>
            </label>
            <label className="settings-toggle-row settings-toggle-secondary">
              <div><strong>{pick("إظهار الإشعارات", "Show notifications")}</strong><span>{pick("إظهار رسائل النجاح والتحذير.", "Show success and warning messages.")}</span></div>
              <input type="checkbox" checked={settings.showNotifications} onChange={(event) => update("showNotifications", event.target.checked)} />
            </label>
          </article>

          <article className="settings-panel">
            <div className="settings-panel-heading"><ShieldAlert size={22} /><div><span>{pick("السلامة", "SAFETY")}</span><h2>{pick("تأكيد الإجراءات الخطرة", "Destructive action confirmation")}</h2></div></div>
            <label className="settings-toggle-row">
              <div><strong>{pick("طلب تأكيد", "Require confirmation")}</strong><span>{pick("الاحتفاظ بالتأكيد قبل الحذف والتعطيل.", "Keep confirmation before delete and disable actions.")}</span></div>
              <input type="checkbox" checked={settings.confirmDestructive} onChange={(event) => update("confirmDestructive", event.target.checked)} />
            </label>
          </article>
        </section>

        <section className="settings-footer-panel">
          <div><Settings2 size={22} /><div><strong>{pick("إعدادات محلية", "Local preferences")}</strong><p>{pick("يتم حفظ هذه الإعدادات في هذا المتصفح ولا تغيّر إعدادات الخادم.", "These preferences are stored in this browser and do not change server configuration.")}</p></div></div>
          <button type="button" onClick={reset}>{pick("إعادة الضبط", "Reset defaults")}</button>
        </section>
      </div>
    </main>
  );
}

export default AdminSettings;
