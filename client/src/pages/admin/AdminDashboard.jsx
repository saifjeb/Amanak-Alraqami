import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CircleCheckBig,
  Compass,
  FileQuestion,
  Image,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { api } from "../../api/api.js";
import { useLanguage } from "../../i18n/useLanguage.js";
import AdminNav from "../../components/admin/AdminNav.jsx";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const { pick, isArabic } = useLanguage();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get("/admin/dashboard")
      .then((response) => {
        if (!active) return;
        setStats(
          response.data?.dashboard ||
            response.data?.stats ||
            response.data ||
            {},
        );
      })
      .catch((err) => {
        if (!active) return;

        if (err.response?.status === 401) {
          navigate("/admin/login", { replace: true });
          return;
        }

        setError(
          err.response?.data?.message ||
            pick("تعذر تحميل لوحة التحكم.", "Could not load dashboard."),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [navigate, pick]);

  const kpis = [
    {
      label: pick("إجمالي الأطفال", "Total children"),
      value: stats.total_children ?? 0,
      icon: UsersRound,
    },
    {
      label: pick("أولياء الأمور", "Parents"),
      value: stats.total_parents ?? 0,
      icon: UsersRound,
    },
    {
      label: pick("المغامرات النشطة", "Active adventures"),
      value: stats.total_adventures ?? 0,
      icon: Compass,
    },
    {
      label: pick("المغامرات المكتملة", "Completed adventures"),
      value: stats.completed_adventures ?? 0,
      icon: CircleCheckBig,
    },
    {
      label: pick("الشارات الممنوحة", "Badges awarded"),
      value: stats.total_badges_awarded ?? 0,
      icon: Award,
    },
  ];

  const assessments = [
    {
      label: pick("متوسط الاختبار القبلي", "Average Pre-Test"),
      value: `${Number(stats.average_pre_test || 0).toFixed(2)}%`,
      icon: BrainCircuit,
    },
    {
      label: pick("متوسط الاختبار البعدي", "Average Post-Test"),
      value: `${Number(stats.average_post_test || 0).toFixed(2)}%`,
      icon: Target,
    },
    {
      label: pick("متوسط التحسن", "Average improvement"),
      value: `${Number(stats.average_improvement || 0) > 0 ? "+" : ""}${Number(
        stats.average_improvement || 0,
      ).toFixed(2)}%`,
      icon: TrendingUp,
    },
  ];

  const managementLinks = [
    {
      to: "/admin/students",
      icon: UsersRound,
      title: pick("إدارة الطلبة", "Student Management"),
      description: pick(
        "عرض حسابات الطلبة وتفعيلها أو تعطيلها.",
        "Review student accounts and control account access.",
      ),
    },
    {
      to: "/admin/adventures",
      icon: BookOpenCheck,
      title: pick("إدارة المغامرات", "Adventure Management"),
      description: pick(
        "إنشاء وتعديل وتنظيم المغامرات التعليمية.",
        "Create, edit and organize learning adventures.",
      ),
    },
    {
      to: "/admin/questions",
      icon: FileQuestion,
      title: pick("إدارة الأسئلة", "Question Management"),
      description: pick(
        "إدارة أسئلة المغامرات والاختبارات.",
        "Manage adventure, pre-test and post-test questions.",
      ),
    },
    {
      to: "/admin/media",
      icon: Image,
      title: pick("إدارة الوسائط", "Media Management"),
      description: pick(
        "رفع الصور التعليمية وتنظيم مكتبة الوسائط.",
        "Upload educational images and manage the media library.",
      ),
    },
    {
      to: "/admin/analytics",
      icon: BarChart3,
      title: pick("التحليلات", "Analytics"),
      description: pick(
        "عرض مؤشرات الطلبة والمحتوى والتقييمات.",
        "Review student, content, and assessment indicators.",
      ),
    },
    {
      to: "/admin/security",
      icon: ShieldCheck,
      title: pick("الأمان والتدقيق", "Security / Audit"),
      description: pick(
        "التحقق من جلسة الإدارة ومراجعة أحداث الإدارة الأخيرة.",
        "Verify the admin session and review recent admin-side events.",
      ),
    },
    {
      to: "/admin/settings",
      icon: Settings,
      title: pick("الإعدادات", "Settings"),
      description: pick(
        "تخصيص اللغة وكثافة العرض وتفضيلات الإدارة.",
        "Configure language, display density, and admin preferences.",
      ),
    },
  ];

  if (loading) {
    return (
      <main className="admin-dashboard-loading" data-no-auto-translate="true">
        <div className="admin-dashboard-spinner" />
        <h2>{pick("جارٍ تحميل لوحة الإدارة...", "Loading Admin Dashboard...")}</h2>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page" data-no-auto-translate="true">
      <AdminNav />

      <div className="admin-dashboard-container">
        <section className="admin-dashboard-heading">
          <div>
            <h1>{pick("لوحة تحكم الإدارة", "Admin dashboard")}</h1>
            <p>
              {pick(
                "تحكم كامل بالمنصة والإحصاءات وإدارة المحتوى.",
                "Full platform control, analytics, and content management.",
              )}
            </p>
          </div>
        </section>

        {error && (
          <div className="admin-dashboard-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <section className="admin-kpi-grid" aria-label={pick("إحصاءات الإدارة", "Admin statistics")}>
          {kpis.map(({ label, value, icon: Icon }) => (
            <article className="admin-kpi-card" key={label}>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <div className="admin-kpi-icon">
                <Icon size={24} strokeWidth={2.1} />
              </div>
            </article>
          ))}
        </section>

        <section className="admin-dashboard-lower-grid">
          <article className="admin-dashboard-panel admin-assessment-panel">
            <div className="admin-panel-heading">
              <div>
                <span>{pick("أثر التعلم", "LEARNING IMPACT")}</span>
                <h2>{pick("أداء التقييم", "Assessment performance")}</h2>
              </div>
            </div>

            <div className="admin-assessment-list">
              {assessments.map(({ label, value, icon: Icon }) => (
                <div className="admin-assessment-row" key={label}>
                  <div className="admin-assessment-label">
                    <span className="admin-assessment-icon">
                      <Icon size={19} />
                    </span>
                    <span>{label}</span>
                  </div>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-dashboard-panel admin-management-panel">
            <div className="admin-panel-heading">
              <div>
                <span>{pick("الإدارة", "MANAGEMENT")}</span>
                <h2>{pick("اختصارات الإدارة", "Management shortcuts")}</h2>
              </div>
            </div>

            <div className="admin-management-list">
              {managementLinks.map(({ to, icon: Icon, title, description }) => (
                <Link key={to} to={to} className="admin-management-row">
                  <span className="admin-management-icon">
                    <Icon size={19} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                  <b>{isArabic ? "←" : "→"}</b>
                </Link>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

export default AdminDashboard;
