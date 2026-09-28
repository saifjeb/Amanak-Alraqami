import { Link } from "react-router-dom";

import { useLanguage } from "../../i18n/useLanguage.js";

import "./LegalPage.css";

const LAST_UPDATED_EN = "28 September 2026";
const LAST_UPDATED_AR = "28 سبتمبر 2026";

function LegalSection({
  title,
  children,
}) {
  return (
    <section className="legal-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function PrivacyNotice({ pick }) {
  return (
    <>
      <LegalSection
        title={pick(
          "ما المعلومات التي يستخدمها أمانك الرقمي؟",
          "What information does Amanak Alraqami use?",
        )}
      >
        <p>
          {pick(
            "لحسابات الأطفال، يستخدم التطبيق الاسم المستعار، والفئة العمرية، والشخصية المختارة، وبيانات تسجيل الدخول. كما يحتفظ ببيانات التعلم مثل التقدم، والإجابات، ونتائج الاختبارات، والنقاط والشارات.",
            "For child accounts, the application uses a nickname, age group, selected avatar and login credentials. It also keeps learning information such as progress, answers, assessment results, points and badges.",
          )}
        </p>

        <p>
          {pick(
            "لا يحتاج حساب الطفل إلى عنوان بريد إلكتروني.",
            "A child account does not require an email address.",
          )}
        </p>

        <p>
          {pick(
            "لحسابات أولياء الأمور، يستخدم التطبيق الاسم، والبريد الإلكتروني، وبيانات تسجيل الدخول، وحالة التحقق من البريد، وإعدادات الحماية مثل التحقق بخطوتين عند تفعيله، وروابط الحسابات مع الأطفال.",
            "For parent accounts, the application uses the parent's name, email address, login credentials, email-verification status, security settings such as two-step verification when enabled, and parent-child account links.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "لماذا نستخدم هذه المعلومات؟",
          "Why is this information used?",
        )}
      >
        <ul>
          <li>
            {pick(
              "إنشاء الحسابات وتسجيل الدخول وحمايتها.",
              "To create, authenticate and protect accounts.",
            )}
          </li>

          <li>
            {pick(
              "حفظ تقدم الطفل ونتائج التعلم والنقاط والشارات.",
              "To save a child's learning progress, results, points and badges.",
            )}
          </li>

          <li>
            {pick(
              "السماح لولي الأمر المرتبط بمتابعة تقدم الطفل.",
              "To allow a linked parent to view the child's progress.",
            )}
          </li>

          <li>
            {pick(
              "تشغيل وظائف الأمان مثل التحقق من البريد، وإعادة تعيين كلمة المرور، والتحقق بخطوتين.",
              "To operate security features such as email verification, password reset and two-step verification.",
            )}
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        title={pick(
          "ولي الأمر والحساب المرتبط",
          "Linked parent access",
        )}
      >
        <p>
          {pick(
            "عند ربط حساب الطفل بحساب ولي أمر، يستطيع ولي الأمر المرتبط رؤية معلومات الحساب الأساسية والتقدم التعليمي والإنجازات والنتائج التي يعرضها التطبيق.",
            "When a child account is linked to a parent account, the linked parent can view the child's basic account information, learning progress, achievements and results displayed by the application.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "ملفات الارتباط والتخزين في المتصفح",
          "Cookies and browser storage",
        )}
      >
        <p>
          {pick(
            "يستخدم التطبيق ملفات ارتباط للمصادقة والحفاظ على جلسة تسجيل الدخول. كما يستخدم تخزين الجلسة في المتصفح لتذكر نوع الحساب الذي تم تسجيل الدخول به والمساعدة في استعادة الجلسة الصحيحة.",
            "The application uses authentication cookies to maintain signed-in sessions. It also uses browser session storage to remember the last signed-in account role and help restore the correct session.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "الأمان والبيانات المؤقتة",
          "Security and temporary data",
        )}
      >
        <p>
          {pick(
            "تستخدم كلمات المرور للتحقق من الحساب ويتم حفظها في قاعدة البيانات بصيغة تجزئة لكلمة المرور. كما يستخدم النظام رموزاً مؤقتة للتحقق من البريد وإعادة تعيين كلمة المرور والتحقق بخطوتين. بعض هذه الرموز تنتهي صلاحيتها أو تتم إزالتها بعد استخدامها.",
            "Passwords are used for authentication and are stored in the database as password hashes. The system also uses temporary security codes or tokens for email verification, password reset and two-step verification. Some of these records expire or are removed after use.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "حذف الحساب",
          "Account deletion",
        )}
      >
        <p>
          {pick(
            "عند حذف حساب طفل، يتم حذف حساب الطفل والبيانات التعليمية المرتبطة به وروابطه مع أولياء الأمور. حذف حساب ولي الأمر يحذف حساب ولي الأمر وروابطه والبيانات الأمنية المرتبطة به، لكنه لا يحذف حساب الطفل.",
            "When a child account is deleted, the child's account, related learning records and parent links are removed. Deleting a parent account removes the parent account, its links and related security records, but does not delete the child's account.",
          )}
        </p>

        <Link to="/account-deletion">
          {pick(
            "اقرأ المزيد عن حذف الحساب",
            "Read more about account deletion",
          )}
        </Link>
      </LegalSection>

      <LegalSection
        title={pick(
          "الأسئلة المتعلقة بالخصوصية",
          "Privacy questions",
        )}
      >
        <p>
          {pick(
            "لأي طلب متعلق بالخصوصية غير متاح مباشرة داخل التطبيق، تواصل مع الجهة المشغلة لأمانك الرقمي عبر وسيلة الاتصال الرسمية التي توفرها.",
            "For a privacy request that is not available directly inside the application, contact the organization operating Amanak Alraqami through its published official contact channel.",
          )}
        </p>
      </LegalSection>
    </>
  );
}

function ChildPrivacy({ pick }) {
  return (
    <>
      <div className="legal-child-intro">
        🛡️{" "}
        {pick(
          "هذه الصفحة تشرح الخصوصية بطريقة بسيطة للأطفال.",
          "This page explains privacy in a simple way for children.",
        )}
      </div>

      <LegalSection
        title={pick(
          "ما الذي يعرفه أمانك عنك؟",
          "What does Amanak know about you?",
        )}
      >
        <p>
          {pick(
            "نحتاج إلى اسمك المستعار، وفئتك العمرية، والشخصية التي تختارها، وكلمة المرور للدخول إلى حسابك. لا تحتاج إلى إعطائنا بريدك الإلكتروني.",
            "We need your nickname, age group, chosen avatar and password so you can use your account. You do not need to give us your email address.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "ماذا نحفظ أثناء التعلم؟",
          "What do we save while you learn?",
        )}
      >
        <p>
          {pick(
            "نحفظ تقدمك في المغامرات، وإجاباتك، ونتائج الاختبارات، والنقاط والشارات حتى تستطيع متابعة رحلتك.",
            "We save your adventure progress, answers, assessment results, points and badges so you can continue your learning journey.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "ماذا يرى ولي الأمر؟",
          "What can a parent see?",
        )}
      >
        <p>
          {pick(
            "إذا ربطت حسابك بحساب ولي أمر باستخدام رمز الربط، يمكن لولي الأمر المرتبط متابعة تقدمك وإنجازاتك والمعلومات التي يعرضها التطبيق عن رحلتك.",
            "If you connect your account to a parent using a link code, that linked parent can follow your progress, achievements and the information the application shows about your learning journey.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "احمِ معلوماتك",
          "Protect your information",
        )}
      >
        <p>
          {pick(
            "لا تشارك كلمة المرور أو عنوان المنزل أو رقم الهاتف أو معلوماتك الخاصة مع الغرباء على الإنترنت. إذا جعلك شيء غير مرتاح، أخبر شخصاً بالغاً تثق به.",
            "Do not share your password, home address, phone number or private information with strangers online. If something makes you uncomfortable, tell a trusted adult.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "هل تستطيع حذف حسابك؟",
          "Can you delete your account?",
        )}
      >
        <p>
          {pick(
            "نعم. حذف الحساب يحتاج إلى تأكيد كلمة المرور. عند الحذف تتم إزالة الحساب والبيانات التعليمية المرتبطة به.",
            "Yes. Account deletion requires password confirmation. When the account is deleted, the account and its related learning information are removed.",
          )}
        </p>

        <Link to="/account-deletion">
          {pick(
            "كيف يعمل حذف الحساب؟",
            "How does account deletion work?",
          )}
        </Link>
      </LegalSection>
    </>
  );
}

function TermsOfUse({ pick }) {
  return (
    <>
      <LegalSection
        title={pick(
          "الغرض من أمانك الرقمي",
          "Purpose of Amanak Alraqami",
        )}
      >
        <p>
          {pick(
            "أمانك الرقمي منصة تعليمية تساعد الأطفال على تعلم مهارات الأمان الرقمي، وتوفر لأولياء الأمور المرتبطين وسيلة لمتابعة تقدم التعلم.",
            "Amanak Alraqami is an educational application designed to help children learn digital-safety skills and to let linked parents follow learning progress.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "استخدام الحساب",
          "Account use",
        )}
      >
        <ul>
          <li>
            {pick(
              "استخدم معلومات صحيحة عند إنشاء حساب ولي الأمر.",
              "Use accurate information when creating a parent account.",
            )}
          </li>

          <li>
            {pick(
              "حافظ على كلمة المرور ورموز التحقق والاسترداد خاصة.",
              "Keep passwords, verification codes and recovery codes private.",
            )}
          </li>

          <li>
            {pick(
              "لا تستخدم حساب شخص آخر أو تحاول الوصول إلى بيانات غير مصرح لك بها.",
              "Do not use another person's account or attempt to access information you are not authorized to access.",
            )}
          </li>
        </ul>
      </LegalSection>

      <LegalSection
        title={pick(
          "حسابات الأطفال وأولياء الأمور",
          "Child and parent accounts",
        )}
      >
        <p>
          {pick(
            "حساب الطفل يستخدم اسماً مستعاراً وفئة عمرية وشخصية. يمكن ربط حساب الطفل بحساب ولي أمر باستخدام رمز مؤقت. الربط يسمح لولي الأمر بالوصول إلى معلومات التقدم التي يوفرها التطبيق.",
            "A child account uses a nickname, age group and avatar. A child account can be linked to a parent using a temporary code. Linking allows the parent to access the progress information provided by the application.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "الاستخدام المقبول",
          "Acceptable use",
        )}
      >
        <p>
          {pick(
            "لا تستخدم الخدمة للإضرار بالمستخدمين الآخرين، أو تعطيل الخدمة، أو محاولة تجاوز ميزات الأمان أو الصلاحيات.",
            "Do not use the service to harm other users, disrupt the service, or attempt to bypass security controls or access permissions.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "المحتوى والميزات",
          "Content and features",
        )}
      >
        <p>
          {pick(
            "قد يتم تحديث المحتوى التعليمي أو الميزات أو طريقة عرضها مع تطوير التطبيق. قد تتغير بعض الوظائف أو تصبح غير متاحة مؤقتاً أثناء الصيانة.",
            "Educational content, features and presentation may be updated as the application develops. Some functions may change or be temporarily unavailable during maintenance.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "إنهاء الحساب",
          "Ending an account",
        )}
      >
        <p>
          {pick(
            "يمكن للمستخدم حذف حسابه من خلال وظيفة حذف الحساب المتاحة في التطبيق بعد تأكيد كلمة المرور. راجع صفحة حذف الحساب لمعرفة أثر الحذف.",
            "A user can delete an account using the account-deletion function in the application after confirming the password. See the Account Deletion page for the effect of deletion.",
          )}
        </p>

        <Link to="/account-deletion">
          {pick(
            "تفاصيل حذف الحساب",
            "Account deletion details",
          )}
        </Link>
      </LegalSection>
    </>
  );
}

function AccountDeletion({ pick }) {
  return (
    <>
      <LegalSection
        title={pick(
          "قبل حذف الحساب",
          "Before deleting an account",
        )}
      >
        <p>
          {pick(
            "حذف الحساب إجراء دائم. يطلب التطبيق كلمة المرور للتأكد من أن صاحب الجلسة هو من يطلب الحذف.",
            "Account deletion is permanent. The application requires password confirmation before processing the deletion request.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "حذف حساب الطفل",
          "Deleting a child account",
        )}
      >
        <p>
          {pick(
            "حذف حساب الطفل يزيل حساب الطفل، وتقدمه، وإجابات الأسئلة، ونتائج الاختبارات، والشارات، وروابط الحساب مع أولياء الأمور. لا يؤدي ذلك إلى حذف حساب ولي الأمر.",
            "Deleting a child account removes the child's account, progress, question attempts, assessment results, badges and parent-child links. It does not delete the parent's account.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "حذف حساب ولي الأمر",
          "Deleting a parent account",
        )}
      >
        <p>
          {pick(
            "حذف حساب ولي الأمر يزيل حساب ولي الأمر وروابطه مع الأطفال ورموز الأمان المرتبطة بالحساب. حسابات الأطفال المرتبطة تبقى موجودة.",
            "Deleting a parent account removes the parent account, its child links and account-related security records. Linked child accounts remain available.",
          )}
        </p>
      </LegalSection>

      <LegalSection
        title={pick(
          "بعد الحذف",
          "After deletion",
        )}
      >
        <p>
          {pick(
            "بعد نجاح الحذف يتم إنهاء جلسة الحساب ولا يمكن استخدام جلسة تسجيل الدخول القديمة للوصول إلى الحساب المحذوف.",
            "After deletion succeeds, the account session is ended and the previous signed-in session cannot be used to access the deleted account.",
          )}
        </p>
      </LegalSection>
    </>
  );
}

const pageMeta = {
  privacy: {
    eyebrowAr: "الخصوصية والبيانات",
    eyebrowEn: "PRIVACY & DATA",
    titleAr: "إشعار الخصوصية",
    titleEn: "Privacy Notice",
  },

  childPrivacy: {
    eyebrowAr: "للأطفال",
    eyebrowEn: "FOR CHILDREN",
    titleAr: "خصوصيتك في أمانك الرقمي",
    titleEn: "Your Privacy at Amanak",
  },

  terms: {
    eyebrowAr: "استخدام المنصة",
    eyebrowEn: "USING AMANAK",
    titleAr: "شروط الاستخدام",
    titleEn: "Terms of Use",
  },

  accountDeletion: {
    eyebrowAr: "إدارة الحساب",
    eyebrowEn: "ACCOUNT CONTROL",
    titleAr: "حذف الحساب",
    titleEn: "Account Deletion",
  },
};

function LegalPage({ page }) {
  const {
    isArabic,
    pick,
  } = useLanguage();

  const meta =
    pageMeta[page] ||
    pageMeta.privacy;

  return (
    <main
      className="legal-page"
      dir={isArabic ? "rtl" : "ltr"}
      data-no-auto-translate="true"
    >
      <header className="legal-topbar">
        <Link to="/" className="legal-brand">
          أمانك الرقمي
        </Link>

        <nav>
          <Link to="/privacy">
            {pick("الخصوصية", "Privacy")}
          </Link>

          <Link to="/child-privacy">
            {pick(
              "خصوصية الطفل",
              "Child Privacy",
            )}
          </Link>

          <Link to="/terms">
            {pick(
              "شروط الاستخدام",
              "Terms",
            )}
          </Link>

          <Link to="/account-deletion">
            {pick(
              "حذف الحساب",
              "Account Deletion",
            )}
          </Link>
        </nav>
      </header>

      <div className="legal-container">
        <section className="legal-hero">
          <span>
            {pick(
              meta.eyebrowAr,
              meta.eyebrowEn,
            )}
          </span>

          <h1>
            {pick(
              meta.titleAr,
              meta.titleEn,
            )}
          </h1>

          <p>
            {pick(
              `آخر تحديث: ${LAST_UPDATED_AR}`,
              `Last updated: ${LAST_UPDATED_EN}`,
            )}
          </p>
        </section>

        <article className="legal-card">
          {page === "privacy" && (
            <PrivacyNotice pick={pick} />
          )}

          {page === "childPrivacy" && (
            <ChildPrivacy pick={pick} />
          )}

          {page === "terms" && (
            <TermsOfUse pick={pick} />
          )}

          {page === "accountDeletion" && (
            <AccountDeletion pick={pick} />
          )}
        </article>

        <footer className="legal-footer">
          <Link to="/">
            {pick(
              "العودة إلى الصفحة الرئيسية",
              "Back to home",
            )}
          </Link>

          <span>© 2026 Amanak Alraqami</span>
        </footer>
      </div>
    </main>
  );
}

export default LegalPage;