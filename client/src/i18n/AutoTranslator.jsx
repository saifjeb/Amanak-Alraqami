import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "./useLanguage.js";

const dictionary = {
  "Dashboard": "لوحة التحكم",
  "Students": "الطلبة",
  "Adventures": "المغامرات",
  "Questions": "الأسئلة",
  "Media": "الوسائط",
  "Log out": "تسجيل الخروج",
  "Profile": "الملف الشخصي",
  "My Badges": "شاراتي",
  "Back to Home": "العودة للرئيسية",
  "Back to Parent Dashboard": "العودة إلى لوحة ولي الأمر",
  "Parent Dashboard": "لوحة ولي الأمر",
  "Student Management": "إدارة الطلبة",
  "Adventure Management": "إدارة المغامرات",
  "Question Management": "إدارة الأسئلة",
  "Media Management": "إدارة الوسائط",
  "Admin Dashboard": "لوحة تحكم الإدارة",
  "Admin Login": "دخول الإدارة",
  "Parent Login": "دخول ولي الأمر",
  "Create account": "إنشاء حساب",
  "Register": "إنشاء حساب",
  "Login": "تسجيل الدخول",
  "Log in": "تسجيل الدخول",
  "Email": "البريد الإلكتروني",
  "Password": "كلمة المرور",
  "Confirm Password": "تأكيد كلمة المرور",
  "Nickname": "الاسم المستعار",
  "Age Group": "الفئة العمرية",
  "Choose your age group": "اختر فئتك العمرية",
  "Explorer": "المستكشف",
  "Hero": "البطل",
  "Guardian": "الحامي",
  "Detective": "المحقق",
  "Loading...": "جارٍ التحميل...",
  "Loading your adventures...": "جارٍ تحميل مغامراتك...",
  "Preparing your digital safety journey.": "نجهّز لك رحلة الأمان الرقمي.",
  "Your Digital Adventures": "مغامراتك الرقمية",
  "Your Journey": "رحلتك",
  "Start Adventure": "ابدأ المغامرة",
  "Continue Adventure": "تابع المغامرة",
  "Play Again": "العب مرة أخرى",
  "Completed": "مكتملة",
  "Adventure": "مغامرة",
  "points": "نقطة",
  "Points": "النقاط",
  "Score": "النتيجة",
  "Remember": "تذكّر",
  "No adventures available": "لا توجد مغامرات متاحة",
  "Check back again soon.": "عد إلينا قريباً.",
  "Try Again": "حاول مرة أخرى",
  "Something went wrong": "حدث خطأ",
  "Badges": "الشارات",
  "Level": "المستوى",
  "Pre-Test": "الاختبار القبلي",
  "Post-Test": "الاختبار البعدي",
  "Assessment Performance": "أداء التقييم",
  "Improvement": "التحسن",
  "Children": "الأطفال",
  "Parents": "أولياء الأمور",
  "Active Adventures": "المغامرات النشطة",
  "Completed Adventures": "المغامرات المكتملة",
  "Badges Awarded": "الشارات الممنوحة",
  "CONTROL CENTER": "مركز التحكم",
  "LEARNING IMPACT": "أثر التعلم",
  "Create Question": "إنشاء سؤال",
  "Create Adventure": "إنشاء مغامرة",
  "Edit": "تعديل",
  "Delete": "حذف",
  "Restore": "استعادة",
  "Trash": "المحذوفات",
  "Search": "بحث",
  "Search questions...": "ابحث في الأسئلة...",
  "Search students...": "ابحث في الطلبة...",
  "Search media...": "ابحث في الوسائط...",
  "Save Changes": "حفظ التعديلات",
  "Cancel": "إلغاء",
  "Close": "إغلاق",
  "Upload": "رفع",
  "Choose Image": "اختر صورة",
  "Active Images": "الصور النشطة",
  "Storage Used": "المساحة المستخدمة",
  "Link a child": "ربط طفل",
  "Generate Link Code": "إنشاء رمز ربط",
  "Generating...": "جارٍ الإنشاء...",
  "Linked children": "الأطفال المرتبطون",
  "YOUR FAMILY": "عائلتك",
  "PARENT SPACE": "مساحة ولي الأمر",
  "CHILD PROGRESS": "تقدم الطفل",
  "Total points": "إجمالي النقاط",
  "Adventures complete": "المغامرات المكتملة",
  "Badges earned": "الشارات المكتسبة",
  "Loading linked children...": "جارٍ تحميل الأطفال المرتبطين...",
  "No children linked yet": "لا يوجد أطفال مرتبطون بعد",
  "Connect with Parent": "اربط حسابك بولي الأمر",
  "Parent Link Code": "رمز ربط ولي الأمر",
  "Connect Parent": "ربط ولي الأمر",
  "Return to Dashboard": "العودة إلى لوحة التحكم",
  "My Digital Safety Badges": "شارات الأمان الرقمي الخاصة بي",
  "YOUR ACHIEVEMENTS": "إنجازاتك",
  "Badge Collection": "مجموعة الشارات",
  "Current Level": "المستوى الحالي",
  "Digital Safety Journey": "رحلة الأمان الرقمي",

  "Checking your session...": "جارٍ التحقق من الجلسة...",
  "Please enter your nickname.": "يرجى إدخال اسمك المستعار.",
  "Please enter your password.": "يرجى إدخال كلمة المرور.",
  "Welcome Back!": "مرحباً بعودتك!",
  "Your next digital safety adventure is waiting for you.": "مغامرتك التالية في الأمان الرقمي بانتظارك.",
  "Explore": "استكشف",
  "Earn": "اكسب",
  "Stay Safe": "كن آمناً",
  "Continue Your Adventure": "تابع مغامرتك",
  "Login with your nickname": "سجّل الدخول باستخدام اسمك المستعار",
  "Your nickname": "اسمك المستعار",
  "Your secret password": "كلمة مرورك السرية",
  "Unable to login": "تعذر تسجيل الدخول",
  "Logging in...": "جارٍ تسجيل الدخول...",
  "New to Amanak Alraqami?": "جديد في أمانك الرقمي؟",
  "Create an account": "أنشئ حساباً",
  "Keep your password private. Amanak will never ask you to share it with another child.": "احتفظ بكلمة مرورك لنفسك. لن يطلب منك أمانك مشاركتها مع طفل آخر.",
  "Choose a nickname first.": "اختر اسماً مستعاراً أولاً.",
  "Your nickname needs at least 3 characters.": "يجب أن يتكون الاسم المستعار من 3 أحرف على الأقل.",
  "Choose your age group.": "اختر فئتك العمرية.",
  "Create your secret password.": "أنشئ كلمة مرور سرية.",
  "Your password needs at least 8 characters.": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
  "The two passwords do not match.": "كلمتا المرور غير متطابقتين.",
  "That nickname is already taken. Try another fun nickname!": "هذا الاسم المستعار مستخدم بالفعل. جرّب اسماً آخر.",
  "Too many attempts. Wait a little and try again.": "محاولات كثيرة جداً. انتظر قليلاً ثم حاول مرة أخرى.",
  "Check your information and try again.": "تحقق من معلوماتك وحاول مرة أخرى.",
  "We cannot reach the server right now. Please try again.": "لا يمكننا الوصول إلى الخادم الآن. حاول مرة أخرى.",
  "PARENT AREA": "مساحة ولي الأمر",
  "Help guide their digital journey.": "ساعدهم في رحلتهم الرقمية.",
  "Follow progress, achievements and digital safety learning in one secure place.": "تابع التقدم والإنجازات والتعلم في الأمان الرقمي من مكان آمن واحد.",
  "Be part of their safer digital future.": "كن جزءاً من مستقبلهم الرقمي الأكثر أماناً.",
  "Create your secure parent account and follow your child's digital safety journey.": "أنشئ حساب ولي أمر آمناً وتابع رحلة طفلك في الأمان الرقمي.",
  "Connect Safely": "اربط بأمان",
  "Track Progress": "تابع التقدم",
  "Support Safety": "ادعم الأمان",
  "Create Parent Account": "إنشاء حساب ولي أمر",
  "Set up your secure Amanak parent profile.": "أنشئ ملف ولي الأمر الآمن في أمانك.",
  "Full Name": "الاسم الكامل",
  "Email Address": "البريد الإلكتروني",
  "Already have an account?": "لديك حساب بالفعل؟",
  "Sign In": "تسجيل الدخول",
  "Creating account...": "جارٍ إنشاء الحساب...",
  "ADMINISTRATION": "الإدارة",
  "Amanak Control Center": "مركز تحكم أمانك الرقمي",
  "Secure management for students, learning content, questions and digital media.": "إدارة آمنة للطلبة والمحتوى التعليمي والأسئلة والوسائط الرقمية.",
  "SECURE ACCESS": "دخول آمن",
  "Authorized administrators only.": "للمشرفين المخولين فقط.",
  "Admin Email": "بريد المشرف",
  "Admin password": "كلمة مرور المشرف",
  "Signing in...": "جارٍ تسجيل الدخول...",
  "Enter Admin Dashboard": "دخول لوحة الإدارة",
  "Protected administrator session": "جلسة إدارة محمية",
  "Question": "سؤال",
  "Submit": "إرسال",
  "Next": "التالي",
  "Finish": "إنهاء",
  "Correct": "إجابة صحيحة",
  "Incorrect": "إجابة غير صحيحة",
  "Manage Students": "إدارة الطلبة",
  "Review child accounts, activity, points and account access.": "راجع حسابات الطلبة والنشاط والنقاط وصلاحية الوصول.",
  "Total Students": "إجمالي الطلبة",
  "Enabled": "مفعّل",
  "Disabled": "معطّل",
  "All Statuses": "جميع الحالات",
  "All Ages": "جميع الأعمار",
  "Age 8–10": "العمر 8–10",
  "Age 11–14": "العمر 11–14",
  "Search by nickname or ID...": "ابحث بالاسم المستعار أو الرقم...",
  "Refresh": "تحديث",
  "ACCOUNTS": "الحسابات",
  "Student": "الطالب",
  "Age": "العمر",
  "Last Active": "آخر نشاط",
  "Status": "الحالة",
  "Actions": "الإجراءات",
  "View": "عرض",
  "No students found": "لم يتم العثور على طلبة",
  "Try changing the search or filter.": "جرّب تغيير البحث أو عوامل التصفية.",
  "STUDENT PROFILE": "ملف الطالب",
  "Student Activity": "نشاط الطالب",
  "ACCOUNT INFORMATION": "معلومات الحساب",
  "Created": "تاريخ الإنشاء",
  "Last Login": "آخر تسجيل دخول",
  "Account Access": "صلاحية الحساب",
  "Back to Students": "العودة إلى الطلبة",
  "Loading students...": "جارٍ تحميل الطلبة...",
  "Loading student...": "جارٍ تحميل الطالب...",
  "CONTENT MANAGEMENT": "إدارة المحتوى",
  "Create and manage Amanak's digital safety learning adventures.": "أنشئ وأدر مغامرات أمانك التعليمية في السلامة الرقمية.",
  "Search adventures...": "ابحث في المغامرات...",
  "Arabic Title *": "العنوان بالعربية *",
  "English Title *": "العنوان بالإنجليزية *",
  "Arabic Description": "الوصف بالعربية",
  "English Description": "الوصف بالإنجليزية",
  "Badge Name": "اسم الشارة",
  "Completion Points": "نقاط الإكمال",
  "Display Order *": "ترتيب العرض *",
  "Icon": "الأيقونة",
  "Adventure is active and available to children": "المغامرة مفعّلة ومتاحة للطلبة",
  "Choose Adventure Image": "اختر صورة المغامرة",
  "IMAGE LIBRARY": "مكتبة الصور",
  "Loading media...": "جارٍ تحميل الوسائط...",
  "No media uploaded yet.": "لا توجد وسائط مرفوعة بعد.",
  "Open Media Manager": "فتح إدارة الوسائط",
  "Active": "مفعّل",
  "Inactive": "غير مفعّل",
  "Assigning...": "جارٍ التعيين...",
  "EDUCATIONAL CONTENT": "المحتوى التعليمي",
  "Manage adventure questions and pre/post digital safety assessments.": "إدارة أسئلة المغامرات واختبارات السلامة الرقمية القبلية والبعدية.",
  "Total Questions": "إجمالي الأسئلة",
  "Adventure Question": "سؤال مغامرة",
  "All Adventures": "جميع المغامرات",
  "1. Question Setup": "1. إعداد السؤال",
  "2. Story / Scenario": "2. القصة / السيناريو",
  "3. Question": "3. السؤال",
  "4. Answer Options": "4. خيارات الإجابة",
  "5. Feedback": "5. التغذية الراجعة",
  "Question Type *": "نوع السؤال *",
  "Age Group *": "الفئة العمرية *",
  "Adventure *": "المغامرة *",
  "Select Adventure": "اختر مغامرة",
  "Arabic Story": "القصة بالعربية",
  "English Story": "القصة بالإنجليزية",
  "Arabic Question *": "السؤال بالعربية *",
  "English Question": "السؤال بالإنجليزية",
  "Correct Feedback - Arabic": "تغذية الإجابة الصحيحة - عربي",
  "Correct Feedback - English": "تغذية الإجابة الصحيحة - إنجليزي",
  "Wrong Feedback - Arabic": "تغذية الإجابة الخاطئة - عربي",
  "Wrong Feedback - English": "تغذية الإجابة الخاطئة - إنجليزي",
  "Question type is locked while editing.": "نوع السؤال لا يمكن تغييره أثناء التعديل.",
  "Choose Question Image": "اختر صورة السؤال",
  "MEDIA LIBRARY": "مكتبة الوسائط",
  "No media uploaded.": "لا توجد وسائط مرفوعة.",
  "No questions found": "لم يتم العثور على أسئلة",
  "CONTENT LIBRARY": "مكتبة المحتوى",
  "Upload and manage educational images used in adventures and questions.": "ارفع وأدر الصور التعليمية المستخدمة في المغامرات والأسئلة.",
  "Add New Image": "إضافة صورة جديدة",
  "UPLOAD MEDIA": "رفع وسائط",
  "Browse your computer": "تصفح جهازك",
  "PNG, JPEG or WEBP. Maximum file size: 5 MB.": "PNG أو JPEG أو WEBP. الحد الأقصى للحجم 5 ميغابايت.",
  "Delete Forever": "حذف نهائي",
  "Image": "صورة",

};

function translateString(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (dictionary[trimmed]) return dictionary[trimmed];

  const patterns = [
    [/^(\d+) points$/i, (_, n) => `${n} نقطة`],
    [/^Adventure (\d+)$/i, (_, n) => `المغامرة ${n}`],
    [/^(\d+) of (\d+) adventures completed$/i, (_, a, b) => `${a} من ${b} مغامرات مكتملة`],
    [/^Welcome, (.+)$/i, (_, name) => `مرحباً، ${name}`],
    [/^Welcome back, (.+)!$/i, (_, name) => `مرحباً بعودتك، ${name}!`],
  ];

  for (const [pattern, replacer] of patterns) {
    const match = trimmed.match(pattern);
    if (match) return replacer(...match);
  }

  return null;
}

function translateNode(node, toArabic) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = node.parentElement;
    if (!parent || parent.closest("[data-no-auto-translate='true']")) return;
    if (!node.__amanakOriginalText) node.__amanakOriginalText = node.nodeValue;
    if (!toArabic) {
      if (node.__amanakOriginalText != null && node.nodeValue !== node.__amanakOriginalText) node.nodeValue = node.__amanakOriginalText;
      return;
    }
    const translated = translateString(node.__amanakOriginalText || node.nodeValue || "");
    if (translated) {
      const original = node.__amanakOriginalText || node.nodeValue;
      const leading = original.match(/^\s*/)?.[0] || "";
      const trailing = original.match(/\s*$/)?.[0] || "";
      const nextValue = `${leading}${translated}${trailing}`;
      if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const element = node;
  if (element.matches("script, style, textarea, [data-no-auto-translate='true']")) return;

  ["placeholder", "title", "aria-label"].forEach((attribute) => {
    const value = element.getAttribute(attribute);
    if (!value) return;
    const key = `amanakOriginal${attribute.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`;
    if (!element.dataset[key]) element.dataset[key] = value;
    const original = element.dataset[key];
    if (!toArabic) {
      if (element.getAttribute(attribute) !== original) element.setAttribute(attribute, original);
    } else {
      const nextValue = translateString(original) || original;
      if (element.getAttribute(attribute) !== nextValue) element.setAttribute(attribute, nextValue);
    }
  });

  [...element.childNodes].forEach((child) => translateNode(child, toArabic));
}

export default function AutoTranslator() {
  const { isArabic } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    let translating = false;
    const apply = () => {
      if (translating) return;
      translating = true;
      translateNode(document.body, isArabic);
      translating = false;
    };

    const frame = requestAnimationFrame(apply);
    const observer = new MutationObserver(() => requestAnimationFrame(apply));
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [isArabic, location.pathname]);

  return null;
}
