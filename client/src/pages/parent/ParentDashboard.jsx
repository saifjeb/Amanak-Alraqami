import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Plus, RefreshCw, Users } from "lucide-react";
import { api } from "../../api/api.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import familyImage from "../../assets/family-digital-safety.webp";
import ParentNav from "../../components/parent/ParentNav.jsx";
import AvatarPortrait from "../../components/common/AvatarPortrait.jsx";
import "./ParentDashboard.css";

function ParentDashboard() {
  const navigate = useNavigate();
  const { isArabic, pick } = useLanguage();
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [linkCode, setLinkCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [codeLoading, setCodeLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadChildren() {
    try { setLoading(true); const response = await api.get("/parent/children"); setChildren(response.data?.children || []); }
    catch (err) { if (err.response?.status === 401) navigate("/parent/login", { replace: true }); else setError(err.response?.data?.message || pick("تعذر تحميل الأطفال المرتبطين.", "Could not load linked children.")); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    api.get("/parent/children")
      .then((response) => { if (active) setChildren(response.data?.children || []); })
      .catch((err) => { if (!active) return; if (err.response?.status === 401) navigate("/parent/login", { replace: true }); else setError(err.response?.data?.message || pick("تعذر تحميل الأطفال المرتبطين.", "Could not load linked children.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate, pick]);

  async function generateCode() { try { setCodeLoading(true); setError(""); const response = await api.post("/parent/link-code"); setLinkCode(response.data?.link_code || null); } catch (err) { setError(err.response?.data?.message || pick("تعذر إنشاء رمز الربط.", "Could not generate a link code.")); } finally { setCodeLoading(false); } }
  async function viewChild(child) { try { setSelected({ loading: true }); const response = await api.get(`/parent/children/${child.id}/dashboard`); setSelected(response.data.dashboard); } catch (err) { setError(err.response?.data?.message || pick("تعذر تحميل تقدم الطفل.", "Could not load child progress.")); setSelected(null); } }
  function copyCode() { if (linkCode?.code) navigator.clipboard?.writeText(linkCode.code); }

  return (
    <main className="parent-dashboard-page" data-no-auto-translate="true">
      <ParentNav />

      <div className="parent-dashboard-container">
        <section className="parent-dashboard-hero parent-dashboard-hero-v2">
          <div><span>{pick("مساحة ولي الأمر", "PARENT SPACE")}</span><h1>{pick("ادعم رحلتهم الرقمية بثقة.", "Support their digital journey with confidence.")}</h1><p>{pick("تابع ما يتعلمه طفلك، احتفل بتقدمه، وساعده على بناء عادات رقمية أكثر أماناً.", "See what your child is learning, celebrate progress, and help safer digital habits grow.")}</p></div>
          <div className="parent-dashboard-hero-visual"><img src={familyImage} alt={pick("عائلة تستخدم التقنية معاً", "Family using technology together")} /></div>
        </section>

        <section className="parent-dashboard-actions" id="link">
          <div><h2>{pick("اربط طفلاً", "Link a child")}</h2><p>{pick("أنشئ رمزاً من 6 أرقام واطلب من طفلك إدخاله من حسابه.", "Generate a 6-digit code for your child to enter from their account.")}</p>{linkCode && <div className="parent-link-code"><strong>{linkCode.code}</strong><button type="button" onClick={copyCode} aria-label={pick("نسخ الرمز", "Copy link code")}><Copy size={18} /></button><small>{pick("ينتهي", "Expires")} {new Date(linkCode.expires_at).toLocaleTimeString()}</small></div>}<button type="button" className="parent-generate-button" onClick={generateCode} disabled={codeLoading}><Plus size={18} />{codeLoading ? pick("جارٍ الإنشاء...", "Generating...") : pick("إنشاء رمز ربط", "Generate Link Code")}</button></div>
          <div className="parent-link-instructions"><strong>{pick("كيف يعمل الربط؟", "How linking works")}</strong><p>{pick("أنشئ الرمز هنا، ثم اطلب من طفلك إدخاله من صفحة ربط ولي الأمر. تنتهي صلاحية الرمز بعد 10 دقائق.", "Generate a code here, then ask your child to enter it from the link-parent page. Codes expire after 10 minutes.")}</p></div>
        </section>

        <section className="parent-children-section" id="children">
          <div className="parent-section-heading"><div><span>{pick("عائلتك", "YOUR FAMILY")}</span><h2>{pick("الأطفال المرتبطون", "Linked children")}</h2></div><button type="button" onClick={loadChildren} aria-label={pick("تحديث", "Refresh")}><RefreshCw size={18} /></button></div>
          {error && <div className="parent-dashboard-error" role="alert">⚠️ {error}</div>}
          {loading ? <p className="parent-empty-state">{pick("جارٍ تحميل الأطفال المرتبطين...", "Loading linked children...")}</p> : children.length === 0 ? <div className="parent-empty-state"><Users size={32} /><h3>{pick("لا يوجد أطفال مرتبطون بعد", "No children linked yet")}</h3><p>{pick("أنشئ رمز ربط أعلاه للبدء.", "Generate a link code above to get started.")}</p></div> : <div className="parent-children-grid">{children.map((child) => <button key={child.id} type="button" className="parent-child-card" onClick={() => viewChild(child)}><AvatarPortrait avatar={child.avatar} size="lg" className="parent-child-avatar-image" /><span><strong>{child.nickname}</strong><small>{child.age_group} · {child.total_points || 0} {pick("نقطة", "points")}</small></span><span className="parent-child-arrow">{isArabic ? "←" : "→"}</span></button>)}</div>}
        </section>

        {selected && <section className="parent-child-detail">{selected.loading ? <p>{pick("جارٍ تحميل التقدم...", "Loading progress...")}</p> : <><div className="parent-section-heading"><div><span>{pick("تقدم الطفل", "CHILD PROGRESS")}</span><h2>{selected.child.nickname}</h2></div><button type="button" onClick={() => setSelected(null)}>{pick("إغلاق", "Close")}</button></div><div className="parent-progress-stats"><article><strong>{selected.child.total_points || 0}</strong><span>{pick("إجمالي النقاط", "Total points")}</span></article><article><strong>{selected.progress.filter((item) => item.completed).length}</strong><span>{pick("مغامرات مكتملة", "Adventures complete")}</span></article><article><strong>{selected.badges.length}</strong><span>{pick("شارات مكتسبة", "Badges earned")}</span></article></div><div className="parent-progress-list">{selected.progress.map((item) => <div key={item.adventure_id}><span>{item.icon || "✦"} {(isArabic ? item.title_ar : item.title_en) || item.title_en || item.title_ar}</span><strong>{item.completed ? pick("مكتملة", "Completed") : `${item.score || 0}%`}</strong></div>)}</div></>}</section>}
      </div>
    </main>
  );
}

export default ParentDashboard;
