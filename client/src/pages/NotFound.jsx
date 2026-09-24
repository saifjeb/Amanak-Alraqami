import { Link } from "react-router-dom";
import { Home, ShieldQuestion } from "lucide-react";
import { useLanguage } from "../i18n/useLanguage.js";
import LanguageToggle from "../components/common/LanguageToggle.jsx";
import logo from "../assets/amanak-logo.svg";
import "./NotFound.css";

function NotFound() {
  const { pick } = useLanguage();

  return (
    <main className="not-found-page" data-no-auto-translate="true">
      <header>
        <Link to="/" className="not-found-brand">
          <img src={logo} alt="" />
          <span>{pick("أمانك الرقمي", "Amanak Alraqami")}</span>
        </Link>
        <LanguageToggle compact />
      </header>
      <section>
        <div className="not-found-icon"><ShieldQuestion size={62} /></div>
        <span>404</span>
        <h1>{pick("هذه الصفحة غير موجودة", "This page does not exist")}</h1>
        <p>{pick("ربما تم نقل الرابط أو كتابته بشكل غير صحيح. ارجع للرئيسية وواصل رحلتك بأمان.", "The link may have moved or been typed incorrectly. Return home and continue your safer digital journey.")}</p>
        <Link to="/"><Home size={18} />{pick("العودة إلى الرئيسية", "Back to home")}</Link>
      </section>
    </main>
  );
}

export default NotFound;
