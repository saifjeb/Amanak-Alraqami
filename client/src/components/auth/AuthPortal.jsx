import { Link } from "react-router-dom";
import logo from "../../assets/amanak-logo.svg";
import LanguageToggle from "../common/LanguageToggle.jsx";
import { useLanguage } from "../../i18n/useLanguage.js";
import "./AuthPortal.css";

function AuthPortal({
  tone = "child",
  eyebrow,
  title,
  subtitle,
  arabicTitle,
  image,
  imageAlt = "",
  features = [],
  panelEyebrow,
  panelTitle,
  panelSubtitle,
  children,
}) {
  const { pick } = useLanguage();

  return (
    <main className={`auth-portal auth-portal-${tone}`} data-no-auto-translate="true">
      <div className="auth-portal-topbar">
        <Link to="/" className="auth-portal-home"><img src={logo} alt="" /><span>{pick("أمانك الرقمي", "Amanak Alraqami")}</span></Link>
        <LanguageToggle />
      </div>

      <div className="auth-portal-shell">
        <section className="auth-portal-story">
          <div className="auth-portal-story-copy">
            <span className="auth-portal-eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            {arabicTitle && <h2>{arabicTitle}</h2>}
            <p>{subtitle}</p>
            {features.length > 0 && (
              <div className="auth-portal-features">
                {features.map((item) => <span key={item}>{item}</span>)}
              </div>
            )}
          </div>
          {image && <div className="auth-portal-visual"><img src={image} alt={imageAlt} /></div>}
        </section>

        <section className="auth-portal-panel">
          <header className="auth-portal-panel-heading">
            <span>{panelEyebrow}</span>
            <h2>{panelTitle}</h2>
            <p>{panelSubtitle}</p>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}

export default AuthPortal;
