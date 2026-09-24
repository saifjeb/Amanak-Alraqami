import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {Activity,Award,BarChart3,BookOpenCheck,FileQuestion,Image,RefreshCw,Target,TrendingUp,UsersRound} from "lucide-react";
import { api } from "../../api/api.js";
import AdminNav from "../../components/admin/AdminNav.jsx";
import { useLanguage } from "../../i18n/useLanguage.js";
import "./AdminAnalytics.css";

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function percent(value) {
  return `${number(value).toFixed(1)}%`;
}
function ratio(value, total) {
  const currentValue = number(value);
  const currentTotal = number(total);
  if (currentTotal <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (currentValue / currentTotal) * 100));
}

function formatBytes(bytes) {
  const size = number(bytes);
  if (size < 1024) {
    return `${size.toFixed(0)} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function AdminAnalytics() {
  const navigate = useNavigate();
  const { pick } = useLanguage();
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const loadAnalytics = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      }
      try {
        setError("");
        const response = await api.get("/admin/analytics", {
          params: {
            _ts: Date.now(),
          },
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        setAnalytics(response.data?.analytics || {});
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/admin/login", {
            replace: true,
          });

          return;
        }

        setError(
          err.response?.data?.message ||
            pick(
              "تعذر تحميل بيانات التحليلات.",
              "Could not load analytics data.",
            ),
        );
      } finally {
        if (refresh) {
          setRefreshing(false);
        }
      }
    },
    [navigate, pick],
  );

  useEffect(() => {
    let active = true;

    loadAnalytics().finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [loadAnalytics]);

  const metrics = useMemo(() => {
    const overview = analytics.overview || {};
    const students = analytics.students || {};
    const adventures = analytics.adventures || {};
    const questions = analytics.questions || {};
    const media = analytics.media || {};
    const assessments = analytics.assessments || {};
    const learningStatus = analytics.learning_status || {};
    const ageGroups = Array.isArray(analytics.age_groups) ? analytics.age_groups: [];
    const age810 = ageGroups.find((item) => item.age_group === "8-10");
    const age1114 = ageGroups.find((item) => item.age_group === "11-14");
    const activeAdventures = number(adventures.active);
    const inactiveAdventures = number(adventures.inactive);
    const adventureTrash = number(adventures.trash);
    const adventureQuestions = number(questions.adventure);
    const preQuestions = number(questions.pre_test);
    const postQuestions = number(questions.post_test);
    const questionTrash = number(questions.trash);
    const mediaCount = number(overview.total_media ?? media.active);
    const mediaTrash = number(media.trash);
    const totalStudents = number(overview.total_children ?? students.total);
    const totalAdventures = number(overview.total_adventures ?? activeAdventures + inactiveAdventures);
    const totalQuestions = number(overview.total_questions ?? adventureQuestions + preQuestions + postQuestions);
    const storageBytes = number(media.storage_bytes);
    const completedAdventures = number(overview.completed_adventures);
    const badgesAwarded = number(overview.total_badges_awarded);
    const learningCompleted = number(learningStatus.completed);
    const learningInProgress = number(learningStatus.in_progress);
    const learningNotStarted = number(learningStatus.not_started);
    const learningTotal = learningCompleted + learningInProgress + learningNotStarted;
    const enabled = number(students.enabled);
    const disabled = number(students.disabled);
    const totalTrash = adventureTrash + questionTrash + mediaTrash;
    return {
      totalStudents,
      totalParents: number(overview.total_parents),

      enabled,
      disabled,

      age810: number(age810?.total),
      age1114: number(age1114?.total),

      totalAdventures,
      activeAdventures,
      inactiveAdventures,
      adventureTrash,

      adventureQuestions,
      preQuestions,
      postQuestions,
      questionTrash,
      totalQuestions,

      mediaCount,
      mediaTrash,
      storageBytes,

      completedAdventures,
      badgesAwarded,

      averagePre: number(assessments.average_pre_test),
      averagePost: number(assessments.average_post_test),
      improvement: number(assessments.average_improvement),

      learningCompleted,
      learningInProgress,
      learningNotStarted,
      learningTotal,

      totalTrash,

      learningCompletionRate: ratio(
        learningCompleted,
        learningTotal || totalStudents,
      ),

      enabledRate: ratio(enabled, totalStudents),
      activeAdventureRate: ratio(activeAdventures, totalAdventures),
      badgesPerStudent: totalStudents > 0 ? badgesAwarded / totalStudents : 0,
      completionsPerStudent:
        totalStudents > 0 ? completedAdventures / totalStudents : 0,
      questionsPerAdventure:
        totalAdventures > 0 ? totalQuestions / totalAdventures : 0,
      averageMediaBytes: mediaCount > 0 ? storageBytes / mediaCount : 0,
    };
  }, [analytics]);

  const maxAge = Math.max(metrics.age810, metrics.age1114, 1);

  const maxQuestion = Math.max(
    metrics.adventureQuestions,
    metrics.preQuestions,
    metrics.postQuestions,
    1,
  );

  const maxAssessment = Math.max(metrics.averagePre, metrics.averagePost, 100);
  const maxLearning = Math.max(
    metrics.learningCompleted,
    metrics.learningInProgress,
    metrics.learningNotStarted,
    1,
  );

  const maxAdventure = Math.max(
    metrics.activeAdventures,
    metrics.inactiveAdventures,
    metrics.adventureTrash,
    1,
  );

  const maxAccount = Math.max(metrics.enabled, metrics.disabled, 1);
  if (loading) {
    return (
      <main className="admin-analytics-page" data-no-auto-translate="true">
        <AdminNav />

        <div className="admin-analytics-loading">
          <div className="admin-dashboard-spinner" />

          <h2>{pick("جارٍ تحميل التحليلات...", "Loading analytics...")}</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-analytics-page" data-no-auto-translate="true">
      <AdminNav />

      <div className="admin-analytics-container">
        <section className="admin-page-heading-row">
          <div>
            <span>{pick("تقارير المنصة", "PLATFORM REPORTS")}</span>

            <h1>{pick("التحليلات والإحصاءات", "Analytics & Statistics")}</h1>

            <p>
              {pick(
                "تحليلات مباشرة من قاعدة بيانات المنصة.",
                "Live analytics from the platform database.",
              )}
            </p>
          </div>

          <button
            type="button"
            className="admin-page-refresh"
            onClick={() =>
              loadAnalytics({
                refresh: true,
              })
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={18}
              className={refreshing ? "admin-refresh-spin" : ""}
            />

            {refreshing
              ? pick("جارٍ التحديث...", "Refreshing...")
              : pick("تحديث", "Refresh")}
          </button>
        </section>

        {error && <div className="admin-page-warning">⚠️ {error}</div>}

        <section className="analytics-kpi-grid">
          <article>
            <UsersRound />

            <span>{pick("الأطفال", "Children")}</span>

            <strong>{metrics.totalStudents}</strong>

            <small>
              {metrics.enabled} {pick("مفعّل", "enabled")} · {metrics.disabled}{" "}
              {pick("معطّل", "disabled")}
            </small>
          </article>

          <article>
            <UsersRound />

            <span>{pick("أولياء الأمور", "Parents")}</span>

            <strong>{metrics.totalParents}</strong>

            <small>{pick("حسابات أولياء الأمور", "parent accounts")}</small>
          </article>

          <article>
            <BookOpenCheck />

            <span>{pick("المغامرات النشطة", "Active adventures")}</span>

            <strong>{metrics.activeAdventures}</strong>

            <small>
              {metrics.inactiveAdventures} {pick("غير نشطة", "inactive")} ·{" "}
              {metrics.adventureTrash} {pick("محذوفة", "trash")}
            </small>
          </article>

          <article>
            <FileQuestion />

            <span>{pick("الأسئلة", "Questions")}</span>

            <strong>{metrics.totalQuestions}</strong>

            <small>
              {metrics.adventureQuestions} · {metrics.preQuestions} ·{" "}
              {metrics.postQuestions}
            </small>
          </article>

          <article>
            <Award />

            <span>{pick("الشارات الممنوحة", "Badges awarded")}</span>

            <strong>{metrics.badgesAwarded}</strong>

            <small>
              {metrics.badgesPerStudent.toFixed(2)}{" "}
              {pick("لكل طالب", "per student")}
            </small>
          </article>

          <article>
            <Image />

            <span>{pick("الوسائط", "Media")}</span>

            <strong>{metrics.mediaCount}</strong>

            <small>
              {formatBytes(metrics.storageBytes)} · {metrics.mediaTrash}{" "}
              {pick("محذوفة", "trash")}
            </small>
          </article>
        </section>

        <section className="analytics-grid">
          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("التقييم", "ASSESSMENTS")}</span>

                <h2>
                  {pick(
                    "الاختبار القبلي مقابل البعدي",
                    "Pre-Test vs Post-Test",
                  )}
                </h2>
              </div>

              <Target size={22} />
            </div>

            <div className="analytics-bars">
              <div className="analytics-bar-row">
                <div>
                  <span>{pick("الاختبار القبلي", "Pre-Test")}</span>

                  <strong>{percent(metrics.averagePre)}</strong>
                </div>

                <div className="analytics-track">
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        (metrics.averagePre / maxAssessment) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="analytics-bar-row">
                <div>
                  <span>{pick("الاختبار البعدي", "Post-Test")}</span>

                  <strong>{percent(metrics.averagePost)}</strong>
                </div>

                <div className="analytics-track">
                  <i
                    style={{
                      width: `${Math.min(
                        100,
                        (metrics.averagePost / maxAssessment) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="analytics-highlight">
              <TrendingUp size={21} />

              <div>
                <span>{pick("متوسط التحسن", "Average improvement")}</span>

                <strong>
                  {metrics.improvement > 0 ? "+" : ""}
                  {percent(metrics.improvement)}
                </strong>
              </div>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("الفئات العمرية", "AGE GROUPS")}</span>

                <h2>{pick("توزيع الطلبة", "Student distribution")}</h2>
              </div>

              <UsersRound size={22} />
            </div>

            <div className="analytics-bars">
              <div className="analytics-bar-row">
                <div>
                  <span>8–10</span>

                  <strong>{metrics.age810}</strong>
                </div>

                <div className="analytics-track">
                  <i
                    style={{
                      width: `${(metrics.age810 / maxAge) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="analytics-bar-row">
                <div>
                  <span>11–14</span>

                  <strong>{metrics.age1114}</strong>
                </div>

                <div className="analytics-track">
                  <i
                    style={{
                      width: `${(metrics.age1114 / maxAge) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("المحتوى", "CONTENT")}</span>

                <h2>{pick("الأسئلة حسب النوع", "Questions by type")}</h2>
              </div>

              <BarChart3 size={22} />
            </div>

            <div className="analytics-bars">
              {[
                [pick("مغامرة", "Adventure"), metrics.adventureQuestions],
                [pick("اختبار قبلي", "Pre-Test"), metrics.preQuestions],
                [pick("اختبار بعدي", "Post-Test"), metrics.postQuestions],
              ].map(([label, value]) => (
                <div className="analytics-bar-row" key={label}>
                  <div>
                    <span>{label}</span>

                    <strong>{value}</strong>
                  </div>

                  <div className="analytics-track">
                    <i
                      style={{
                        width: `${(value / maxQuestion) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("التفاعل", "ENGAGEMENT")}</span>

                <h2>{pick("مؤشرات التعلم", "Learning activity")}</h2>
              </div>

              <Activity size={22} />
            </div>

            <div className="analytics-stat-list">
              <div>
                <span>
                  {pick("المغامرات المكتملة", "Adventure completions")}
                </span>

                <strong>{metrics.completedAdventures}</strong>
              </div>

              <div>
                <span>{pick("الشارات الممنوحة", "Badges awarded")}</span>

                <strong>{metrics.badgesAwarded}</strong>
              </div>

              <div>
                <span>{pick("الطلبة المفعّلون", "Enabled students")}</span>

                <strong>{metrics.enabled}</strong>
              </div>

              <div>
                <span>{pick("الطلبة المعطّلون", "Disabled students")}</span>

                <strong>{metrics.disabled}</strong>
              </div>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("تقدم الطلبة", "LEARNING STATUS")}</span>

                <h2>{pick("حالة رحلة التعلم", "Learning journey status")}</h2>
              </div>

              <TrendingUp size={22} />
            </div>

            <div className="analytics-bars">
              {[
                [pick("مكتمل", "Completed"), metrics.learningCompleted],
                [pick("قيد التقدم", "In Progress"), metrics.learningInProgress],
                [pick("لم يبدأ", "Not Started"), metrics.learningNotStarted],
              ].map(([label, value]) => (
                <div className="analytics-bar-row" key={label}>
                  <div>
                    <span>{label}</span>

                    <strong>{value}</strong>
                  </div>

                  <div className="analytics-track">
                    <i
                      style={{
                        width: `${(value / maxLearning) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("حالة المحتوى", "ADVENTURE STATUS")}</span>

                <h2>{pick("حالة المغامرات", "Adventure status")}</h2>
              </div>

              <BookOpenCheck size={22} />
            </div>

            <div className="analytics-bars">
              {[
                [pick("نشطة", "Active"), metrics.activeAdventures],
                [pick("غير نشطة", "Inactive"), metrics.inactiveAdventures],
                [pick("سلة المهملات", "Trash"), metrics.adventureTrash],
              ].map(([label, value]) => (
                <div className="analytics-bar-row" key={label}>
                  <div>
                    <span>{label}</span>

                    <strong>{value}</strong>
                  </div>

                  <div className="analytics-track">
                    <i
                      style={{
                        width: `${(value / maxAdventure) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("الحسابات", "ACCOUNT STATUS")}</span>

                <h2>{pick("حالة حسابات الطلبة", "Student account status")}</h2>
              </div>

              <UsersRound size={22} />
            </div>

            <div className="analytics-bars">
              {[
                [pick("مفعّلة", "Enabled"), metrics.enabled],
                [pick("معطّلة", "Disabled"), metrics.disabled],
              ].map(([label, value]) => (
                <div className="analytics-bar-row" key={label}>
                  <div>
                    <span>{label}</span>

                    <strong>{value}</strong>
                  </div>

                  <div className="analytics-track">
                    <i
                      style={{
                        width: `${(value / maxAccount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("مؤشرات النسب", "PLATFORM RATES")}</span>

                <h2>{pick("مؤشرات الأداء", "Performance rates")}</h2>
              </div>

              <TrendingUp size={22} />
            </div>

            <div className="analytics-bars">
              <div className="analytics-bar-row">
                <div>
                  <span>
                    {pick("إكمال رحلة التعلم", "Learning completion")}
                  </span>

                  <strong>{percent(metrics.learningCompletionRate)}</strong>
                </div>

                <div className="analytics-track">
                  <i
                    style={{
                      width: `${metrics.learningCompletionRate}%`,
                    }}
                  />
                </div>
              </div>

              <div className="analytics-bar-row">
                <div>
                  <span>{pick("الحسابات المفعّلة", "Enabled accounts")}</span>

                  <strong>{percent(metrics.enabledRate)}</strong>
                </div>

                <div className="analytics-track">
                  <i
                    style={{
                      width: `${metrics.enabledRate}%`,
                    }}
                  />
                </div>
              </div>

              <div className="analytics-bar-row">
                <div>
                  <span>{pick("المغامرات النشطة", "Active adventures")}</span>

                  <strong>{percent(metrics.activeAdventureRate)}</strong>
                </div>

                <div className="analytics-track">
                  <i
                    style={{
                      width: `${metrics.activeAdventureRate}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("صحة المحتوى", "CONTENT HEALTH")}</span>

                <h2>{pick("نظرة عامة على المحتوى", "Content overview")}</h2>
              </div>

              <BarChart3 size={22} />
            </div>

            <div className="analytics-stat-list">
              <div>
                <span>{pick("المغامرات المتاحة", "Live adventures")}</span>

                <strong>{metrics.totalAdventures}</strong>
              </div>

              <div>
                <span>{pick("الأسئلة المتاحة", "Live questions")}</span>

                <strong>{metrics.totalQuestions}</strong>
              </div>

              <div>
                <span>{pick("الوسائط النشطة", "Active media")}</span>

                <strong>{metrics.mediaCount}</strong>
              </div>

              <div>
                <span>{pick("إجمالي سلة المهملات", "Total trash")}</span>

                <strong>{metrics.totalTrash}</strong>
              </div>
            </div>
          </article>

          <article className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <span>{pick("المتوسطات", "AVERAGES")}</span>

                <h2>{pick("متوسط المؤشرات", "Average indicators")}</h2>
              </div>

              <Activity size={22} />
            </div>

            <div className="analytics-stat-list">
              <div>
                <span>{pick("شارات لكل طالب", "Badges per student")}</span>

                <strong>{metrics.badgesPerStudent.toFixed(2)}</strong>
              </div>

              <div>
                <span>
                  {pick("إكمالات لكل طالب", "Completions per student")}
                </span>

                <strong>{metrics.completionsPerStudent.toFixed(2)}</strong>
              </div>

              <div>
                <span>
                  {pick("أسئلة لكل مغامرة", "Questions per adventure")}
                </span>

                <strong>{metrics.questionsPerAdventure.toFixed(1)}</strong>
              </div>

              <div>
                <span>{pick("متوسط حجم الوسائط", "Average media size")}</span>

                <strong>{formatBytes(metrics.averageMediaBytes)}</strong>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

export default AdminAnalytics;
