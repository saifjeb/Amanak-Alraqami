import { Languages } from "lucide-react";
import { useLanguage } from "../../i18n/useLanguage.js";
import "./LanguageToggle.css";

function LanguageToggle({ compact = false, className = "" }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`language-toggle ${compact ? "compact" : ""} ${className}`} data-no-auto-translate="true" aria-label="Language selector">
      <Languages size={compact ? 15 : 17} aria-hidden="true" />
      <button
        type="button"
        className={language === "ar" ? "active" : ""}
        onClick={() => setLanguage("ar")}
        aria-pressed={language === "ar"}
      >
        عربي
      </button>
      <span>/</span>
      <button
        type="button"
        className={language === "en" ? "active" : ""}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        EN
      </button>
    </div>
  );
}

export default LanguageToggle;
