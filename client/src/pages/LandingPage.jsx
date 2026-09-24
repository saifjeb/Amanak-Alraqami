import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Gamepad2,
  HeartHandshake,
  LockKeyhole,
  School,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import LanguageToggle from "../components/common/LanguageToggle.jsx";
import { useLanguage } from "../i18n/useLanguage.js";
import logo from "../assets/amanak-logo.svg";
import heroesImage from "../assets/amanak-heroes.webp";
import ageYoungImage from "../assets/age-8-10.webp";
import ageTeenImage from "../assets/age-11-14.webp";
import familyImage from "../assets/family-digital-safety.webp";
import schoolImage from "../assets/school-digital-safety.webp";
import "./LandingPage.css";

const copy = {
  ar: {
    home: "الرئيسية",
    about: "من نحن",
    adventures: "المغامرات",
    parents: "لأولياء الأمور",
    schools: "للمدارس",
    resources: "الموارد",
    contact: "اتصل بنا",
    login: "تسجيل الدخول",
    start: "ابدأ الآن",
    kicker: "معاً لمستقبل رقمي أكثر أماناً",
    title1: "خطوات صغيرة..",
    title2: "لمستقبل رقمي أكثر أماناً",
    description: "مغامرات تفاعلية تعلّم الأطفال مهارات الحياة الرقمية ليستكشفوا، ويتعلموا، ويبقوا آمنين ويحْموا أنفسهم والآخرين.",
    startAdventure: "ابدأ المغامرة الآن",
    watchVideo: "اكتشف كيف يعمل",
    interactive: "مغامرات تفاعلية وممتعة",
    realSkills: "مهارات من الحياة الرقمية",
    positive: "بيئة آمنة وإيجابية",
    familyReady: "للأطفال وأولياء الأمور والمدارس",
    progress: "متابعة التقدم والإنجازات",
    childrenLearning: "فئتان عمريتان",
    partnerSchools: "مساحات مستخدمين",
    recommend: "تجربة ثنائية اللغة",
    choose: "اختر مغامرتك",
    viewAll: "عرض جميع المغامرات",
    youngTitle: "المستكشف الصغير",
    youngText: "مغامرات مرحة لبناء عادات رقمية ذكية وآمنة خطوة بخطوة.",
    teenTitle: "المستكشف المتقدم",
    teenText: "تحديات واقعية ومهارات أعمق لاتخاذ قرارات واعية في العالم الرقمي.",
    parentsTitle: "لأولياء الأمور",
    parentsText: "تابع رحلة طفلك الرقمية، واحتفل بتقدمه، وساعده على بناء عادات أكثر أماناً.",
    parentsCta: "اعرف المزيد",
    schoolsTitle: "للمدارس",
    schoolsText: "برامج ومحتوى رقمي مصمم لدعم تعليم السلامة الرقمية داخل المدرسة.",
    schoolsCta: "استكشف البرنامج",
    latest: "أحدث المغامرات",
    adventure1: "السلامة على وسائل التواصل",
    adventure2: "الصداقة عبر الإنترنت",
    adventure3: "الخصوصية والأمان",
    adventure4: "التنمر الإلكتروني",
    footerText: "نبني جيلاً رقمياً أكثر وعياً وثقة وأماناً.",
    quickLinks: "روابط سريعة",
    parentLinks: "لأولياء الأمور",
    schoolLinks: "للمدارس",
    follow: "اللغة",
    jordan: "صنع بحب في الأردن",
  },
  en: {
    home: "Home",
    about: "About",
    adventures: "Adventures",
    parents: "For Parents",
    schools: "For Schools",
    resources: "Resources",
    contact: "Contact",
    login: "Login",
    start: "Get Started",
    kicker: "Together for a safer digital tomorrow",
    title1: "Small steps.",
    title2: "A safer, brighter digital tomorrow.",
    description: "Interactive adventures that teach children how to explore, learn and stay safe online while protecting themselves and others.",
    startAdventure: "Start an Adventure",
    watchVideo: "See how it works",
    interactive: "Interactive Learning",
    realSkills: "Real-Life Digital Skills",
    positive: "Safe & Positive Environment",
    familyReady: "For Children, Parents & Schools",
    progress: "Progress & Achievements",
    childrenLearning: "Age pathways",
    partnerSchools: "User spaces",
    recommend: "Bilingual experience",
    choose: "Choose Your Adventure",
    viewAll: "View all adventures",
    youngTitle: "Young Explorer",
    youngText: "Playful guided adventures that build smart, safe digital habits step by step.",
    teenTitle: "Advanced Explorer",
    teenText: "Realistic challenges and deeper skills for making confident choices online.",
    parentsTitle: "For Parents",
    parentsText: "Follow your child’s digital journey, celebrate progress and help safer habits grow.",
    parentsCta: "Learn More",
    schoolsTitle: "For Schools",
    schoolsText: "Digital safety programs and learning content designed for classroom use.",
    schoolsCta: "Explore the Program",
    latest: "Latest Adventures",
    adventure1: "Social Media Safety",
    adventure2: "Online Friendships",
    adventure3: "Privacy & Security",
    adventure4: "Cyberbullying",
    footerText: "Building a more confident, aware and safer digital generation.",
    quickLinks: "Quick Links",
    parentLinks: "For Parents",
    schoolLinks: "For Schools",
    follow: "Language",
    jordan: "Made with care in Jordan",
  },
};

const featureIcons = [Gamepad2, Sparkles, ShieldCheck, Users, BarChart3];

function LandingPage() {
  const { language, isArabic } = useLanguage();
  const t = copy[language];
  const Arrow = isArabic ? ArrowLeft : ArrowRight;

  const nav = [
    [t.home, "#top"],
    [t.about, "#about"],
    [t.adventures, "#adventures"],
    [t.parents, "#parents"],
    [t.schools, "#schools"],
    [t.resources, "#resources"],
  ];

  const features = [t.interactive, t.realSkills, t.positive, t.familyReady, t.progress];

  const latest = [
    ["💬", t.adventure1, "8–10"],
    ["🧑‍🤝‍🧑", t.adventure2, "8–10"],
    ["🔒", t.adventure3, "11–14"],
    ["🛡️", t.adventure4, "11–14"],
  ];

  return (
    <main className="landing-page" id="top" data-no-auto-translate="true">
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="Amanak Alraqami home">
          <img src={logo} alt="Amanak Alraqami" />
          <span>
            <strong>{isArabic ? "أمانك الرقمي" : "Amanak Alraqami"}</strong>
            <small>{isArabic ? "Amanak Alraqami" : "أمانك الرقمي"}</small>
          </span>
        </Link>

        <nav className="landing-nav" aria-label="Main navigation">
          {nav.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>

        <div className="landing-header-actions">
          <LanguageToggle compact />
          <Link className="landing-login" to="/child/login">{t.login}</Link>
          <Link className="landing-get-started" to="/child/register">{t.start}<Arrow size={16} /></Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-kicker"><ShieldCheck size={16} />{t.kicker}</span>
          <h1><span>{t.title1}</span>{t.title2}</h1>
          <p>{t.description}</p>
          <div className="landing-hero-actions">
            <Link to="/child/register" className="landing-primary">{t.startAdventure}<Arrow size={19} /></Link>
            <a href="#about" className="landing-secondary"><BookOpenCheck size={18} />{t.watchVideo}</a>
          </div>
          <div className="landing-trust-line">
            <span><ShieldCheck size={15} />{isArabic ? "تجربة تراعي خصوصية الطفل" : "Privacy-first child experience"}</span>
            <span><LockKeyhole size={15} />No child email required</span>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="hero-skyline" aria-hidden="true" />
          <img src={heroesImage} alt={isArabic ? "أبطال أمانك الرقمي" : "Amanak digital safety heroes"} />
          <div className="hero-float-card hero-float-a"><Star size={18} />{isArabic ? "تعلّم" : "Learn"}</div>
          <div className="hero-float-card hero-float-b"><ShieldCheck size={18} />{isArabic ? "كن آمناً" : "Stay safe"}</div>
        </div>
      </section>

      <section className="landing-feature-strip" id="about">
        {features.map((label, index) => {
          const Icon = featureIcons[index];
          return <article key={label}><span><Icon size={22} /></span><strong>{label}</strong></article>;
        })}
      </section>

      <section className="landing-stats" aria-label="Platform highlights">
        <article><Users size={28} /><strong>2</strong><span>{t.childrenLearning}</span></article>
        <article><School size={28} /><strong>3</strong><span>{t.partnerSchools}</span></article>
        <article><HeartHandshake size={28} /><strong>AR / EN</strong><span>{t.recommend}</span></article>
      </section>

      <section className="landing-content-grid" id="adventures">
        <div className="landing-adventure-area">
          <div className="landing-section-heading"><div><span>DIGITAL SAFETY JOURNEY</span><h2>{t.choose}</h2></div><Link to="/child/register">{t.viewAll}<Arrow size={16} /></Link></div>
          <div className="age-path-grid">
            <article className="age-path-card young-card">
              <img src={ageYoungImage} alt={t.youngTitle} />
              <div className="age-card-copy"><span>8–10</span><h3>{t.youngTitle}</h3><p>{t.youngText}</p><Link to="/child/register">{t.start}<Arrow size={16} /></Link></div>
            </article>
            <article className="age-path-card teen-card">
              <img src={ageTeenImage} alt={t.teenTitle} />
              <div className="age-card-copy"><span>11–14</span><h3>{t.teenTitle}</h3><p>{t.teenText}</p><Link to="/child/register">{t.start}<Arrow size={16} /></Link></div>
            </article>
          </div>
        </div>

        <aside className="latest-adventures">
          <div className="landing-section-heading"><div><span>WHAT’S NEW</span><h2>{t.latest}</h2></div></div>
          <div className="latest-list">
            {latest.map(([icon, title, age]) => <Link key={title} to="/child/register"><span className="latest-icon">{icon}</span><span><strong>{title}</strong><small>{age}</small></span><Arrow size={17} /></Link>)}
          </div>
        </aside>
      </section>

      <section className="landing-audience-grid">
        <article className="audience-card parent-card" id="parents">
          <div className="audience-image"><img src={familyImage} alt={t.parentsTitle} /></div>
          <div><span>PARENTS</span><h2>{t.parentsTitle}</h2><p>{t.parentsText}</p><Link to="/parent/login">{t.parentsCta}<Arrow size={17} /></Link></div>
        </article>
        <article className="audience-card school-card" id="schools">
          <div className="audience-image"><img src={schoolImage} alt={t.schoolsTitle} /></div>
          <div><span>SCHOOLS</span><h2>{t.schoolsTitle}</h2><p>{t.schoolsText}</p><a href="#adventures">{t.schoolsCta}<Arrow size={17} /></a></div>
        </article>
      </section>

      <footer className="landing-footer" id="resources">
        <div className="footer-brand"><img src={logo} alt="" /><div><strong>{isArabic ? "أمانك الرقمي" : "Amanak Alraqami"}</strong><span>{t.footerText}</span></div></div>
        <div className="footer-column"><strong>{t.quickLinks}</strong><a href="#top">{t.home}</a><a href="#about">{t.about}</a><a href="#adventures">{t.adventures}</a></div>
        <div className="footer-column"><strong>{t.parentLinks}</strong><Link to="/parent/login">{t.login}</Link><Link to="/parent/register">{isArabic ? "إنشاء حساب" : "Register"}</Link></div>
        <div className="footer-column"><strong>{t.schoolLinks}</strong><a href="#schools">{t.schoolsTitle}</a><a href="#adventures">{t.resources}</a></div>
        <div className="footer-social"><strong>{t.follow}</strong><div><span>عربي</span><span>EN</span></div><small>{t.jordan} 🇯🇴</small></div>
      </footer>
      <div className="landing-legal"><span>© 2026 Amanak Alraqami</span><span>{isArabic ? "الخصوصية · شروط الاستخدام" : "Privacy · Terms of Use"}</span><Link to="/admin/login">Admin</Link></div>
    </main>
  );
}

export default LandingPage;
