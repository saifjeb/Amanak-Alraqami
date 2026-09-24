import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {AlertTriangle,CheckCircle2,Clock3,Database,KeyRound,LogIn,LogOut,RefreshCw,ShieldAlert,ShieldCheck,ShieldEllipsis,Trash2,UserRoundCheck} from "lucide-react";
import { api } from "../../api/api.js";
import AdminNav from "../../components/admin/AdminNav.jsx";
import "./AdminSecurity.css";

function formatAction(value) {
  const actions = {
    "admin.login_success": "Admin login success",
    "admin.login_failed": "Admin login failed",
    "admin.logout": "Admin logout",
    "student.disable": "Student disable",
    "student.enable": "Student enable",
    "student.permanent_delete": "Student permanent delete",
    "adventure.create": "Adventure create",
    "adventure.update": "Adventure update",
    "adventure.set_image": "Adventure set image",
    "adventure.trash": "Adventure trash",
    "adventure.restore": "Adventure restore",
    "adventure.permanent_delete": "Adventure permanent delete",
    "question.create": "Question create",
    "question.update": "Question update",
    "question.set_image": "Question set image",
    "question.trash": "Question trash",
    "question.restore": "Question restore",
    "question.permanent_delete": "Question permanent delete",
    "media.upload": "Media upload",
    "media.trash": "Media trash",
    "media.restore": "Media restore",
    "media.permanent_delete": "Media permanent delete",
  };

  if (!value) {
    return "Admin event";
  }

  return (
    actions[value] || String(value).replace(/\./g, " · ").replace(/_/g, " ")
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function isAuthenticationEvent(entry) {
  return ["admin.login_success", "admin.login_failed", "admin.logout"].includes(
    entry?.action,
  );
}

function isDestructiveEvent(entry) {
  const action = String(entry?.action || "");

  return (
    action.includes("permanent_delete") ||
    action.endsWith(".trash") ||
    action === "student.disable"
  );
}

function AdminSecurity() {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const [summary, setSummary] = useState({
    total_events: 0,
    events_last_24_hours: 0,
    failed_events: 0,
    last_event_at: null,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditConnected, setAuditConnected] = useState(false);
  const [error, setError] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  const handleUnauthorized = useCallback(() => {
    navigate("/admin/login", {
      replace: true,
    });
  }, [navigate]);

  const loadSession = useCallback(async () => {
    const response = await api.get("/admin/me", {
      params: {
        _ts: Date.now(),
      },
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    const admin = response.data?.admin || response.data?.user || response.data;

    setSession(admin || null);
  }, []);

  const loadAudit = useCallback(async () => {
    const response = await api.get("/admin/security/audit", {
      params: {
        limit: 100,
        _ts: Date.now(),
      },
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });

    const logs = Array.isArray(response.data?.audit_logs)
      ? response.data.audit_logs
      : [];

    setAuditLogs(logs);

    setSummary({
      total_events: Number(response.data?.summary?.total_events) || 0,

      events_last_24_hours:
        Number(response.data?.summary?.events_last_24_hours) || 0,

      failed_events: Number(response.data?.summary?.failed_events) || 0,

      last_event_at: response.data?.summary?.last_event_at || null,
    });

    setAuditConnected(true);
  }, []);

  const loadSecurity = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        }

        setError("");

        await Promise.all([loadSession(), loadAudit()]);
      } catch (err) {
        console.error("Security page error:", err);

        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }

        setAuditConnected(false);

        setError(
          err.response?.data?.message ||
            "Could not load Security / Audit data.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [handleUnauthorized, loadAudit, loadSession],
  );

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  async function handleRefresh() {
    if (refreshing) {
      return;
    }

    await loadSecurity({
      refresh: true,
    });
  }

  const securityMetrics = useMemo(() => {
    const successfulLogins = auditLogs.filter(
      (entry) => entry.action === "admin.login_success",
    );

    const failedLogins = auditLogs.filter(
      (entry) => entry.action === "admin.login_failed",
    );

    const logouts = auditLogs.filter(
      (entry) => entry.action === "admin.logout",
    );

    const authenticationEvents = auditLogs.filter(isAuthenticationEvent);

    const destructiveActions = auditLogs.filter(isDestructiveEvent);

    const loadedFailures = auditLogs.filter(
      (entry) => Number(entry.status_code) >= 400,
    );

    return {
      successfulLogins,
      failedLogins,
      logouts,
      authenticationEvents,
      destructiveActions,
      loadedFailures,

      lastSuccessfulLogin: successfulLogins[0] || null,

      lastFailedLogin: failedLogins[0] || null,

      lastLogout: logouts[0] || null,
    };
  }, [auditLogs]);

  const filteredAuditLogs = useMemo(() => {
    if (eventFilter === "authentication") {
      return auditLogs.filter(isAuthenticationEvent);
    }

    if (eventFilter === "failures") {
      return auditLogs.filter((entry) => Number(entry.status_code) >= 400);
    }

    if (eventFilter === "destructive") {
      return auditLogs.filter(isDestructiveEvent);
    }

    return auditLogs;
  }, [auditLogs, eventFilter]);

  if (loading) {
    return (
      <main className="admin-security-page">
        <AdminNav />

        <div className="admin-security-container">
          <div className="admin-security-loading">
            <RefreshCw size={28} className="admin-refresh-spin" />

            <h2>Loading security data...</h2>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-security-page">
      <AdminNav />

      <div className="admin-security-container">
        <section className="admin-page-heading-row">
          <div>
            <span>ADMIN SECURITY</span>

            <h1>Security / Audit</h1>

            <p>
              Monitor administrator access, authentication events and PostgreSQL
              audit activity.
            </p>
          </div>

          <button
            type="button"
            className="admin-page-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={18}
              className={refreshing ? "admin-refresh-spin" : ""}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {error && <div className="admin-page-warning">⚠️ {error}</div>}

        <section className="security-status-grid">
          <article>
            <div
              className={session ? "security-icon ok" : "security-icon pending"}
            >
              <UserRoundCheck size={22} />
            </div>

            <div>
              <span>Admin Session</span>

              <strong>{session ? "Active" : "Unavailable"}</strong>
            </div>

            {session && <CheckCircle2 size={18} className="security-check" />}
          </article>

          <article>
            <div className="security-icon ok">
              <ShieldCheck size={22} />
            </div>

            <div>
              <span>Protected Route</span>

              <strong>Admin role required</strong>
            </div>

            <CheckCircle2 size={18} className="security-check" />
          </article>

          <article>
            <div
              className={
                auditConnected ? "security-icon ok" : "security-icon pending"
              }
            >
              <Database size={22} />
            </div>

            <div>
              <span>PostgreSQL Audit</span>

              <strong>{auditConnected ? "Connected" : "Unavailable"}</strong>
            </div>

            {auditConnected && (
              <CheckCircle2 size={18} className="security-check" />
            )}
          </article>

          <article>
            <div className="security-icon pending">
              <ShieldEllipsis size={22} />
            </div>

            <div>
              <span>Two-Factor Auth</span>

              <strong>Planned</strong>
            </div>
          </article>
        </section>

        <section className="security-status-grid">
          <article>
            <div className="security-icon ok">
              <Database size={22} />
            </div>

            <div>
              <span>Total Events</span>

              <strong>{summary.total_events}</strong>
            </div>
          </article>

          <article>
            <div className="security-icon ok">
              <Clock3 size={22} />
            </div>

            <div>
              <span>Last 24 Hours</span>

              <strong>{summary.events_last_24_hours}</strong>
            </div>
          </article>

          <article>
            <div
              className={
                summary.failed_events > 0
                  ? "security-icon pending"
                  : "security-icon ok"
              }
            >
              <AlertTriangle size={22} />
            </div>

            <div>
              <span>Failed Actions</span>

              <strong>{summary.failed_events}</strong>
            </div>
          </article>

          <article>
            <div className="security-icon ok">
              <Clock3 size={22} />
            </div>

            <div>
              <span>Last Event</span>

              <strong>{formatDate(summary.last_event_at)}</strong>
            </div>
          </article>
        </section>

        <section className="security-status-grid">
          <article>
            <div className="security-icon ok">
              <LogIn size={22} />
            </div>

            <div>
              <span>Successful Logins</span>

              <strong>{securityMetrics.successfulLogins.length}</strong>
            </div>
          </article>

          <article>
            <div
              className={
                securityMetrics.failedLogins.length > 0
                  ? "security-icon pending"
                  : "security-icon ok"
              }
            >
              <ShieldAlert size={22} />
            </div>

            <div>
              <span>Failed Logins</span>

              <strong>{securityMetrics.failedLogins.length}</strong>
            </div>
          </article>

          <article>
            <div className="security-icon ok">
              <LogOut size={22} />
            </div>

            <div>
              <span>Logouts</span>

              <strong>{securityMetrics.logouts.length}</strong>
            </div>
          </article>

          <article>
            <div
              className={
                securityMetrics.destructiveActions.length > 0
                  ? "security-icon pending"
                  : "security-icon ok"
              }
            >
              <Trash2 size={22} />
            </div>

            <div>
              <span>Sensitive Actions</span>

              <strong>{securityMetrics.destructiveActions.length}</strong>
            </div>
          </article>
        </section>

        <section className="security-grid">
          <article className="security-panel">
            <div className="security-panel-heading">
              <div>
                <span>ACCOUNT</span>

                <h2>Current Admin Session</h2>
              </div>

              <ShieldCheck size={23} />
            </div>

            <div className="security-detail-list">
              <div>
                <span>Name</span>

                <strong>{session?.name || "Administrator"}</strong>
              </div>

              <div>
                <span>Email</span>

                <strong>{session?.email || "—"}</strong>
              </div>

              <div>
                <span>Role</span>

                <strong>ADMIN</strong>
              </div>

              <div>
                <span>Session Status</span>

                <strong className="security-good">
                  {session ? "Verified" : "Unavailable"}
                </strong>
              </div>
            </div>
          </article>

          <article className="security-panel">
            <div className="security-panel-heading">
              <div>
                <span>DATABASE</span>

                <h2>Audit Status</h2>
              </div>

              <Database size={23} />
            </div>

            <div className="security-detail-list">
              <div>
                <span>Storage</span>

                <strong>PostgreSQL</strong>
              </div>

              <div>
                <span>Connection</span>

                <strong className={auditConnected ? "security-good" : ""}>
                  {auditConnected ? "Connected" : "Unavailable"}
                </strong>
              </div>

              <div>
                <span>Events</span>

                <strong>{summary.total_events}</strong>
              </div>

              <div>
                <span>Failed</span>

                <strong>{summary.failed_events}</strong>
              </div>
            </div>
          </article>

          <article className="security-panel">
            <div className="security-panel-heading">
              <div>
                <span>AUTHENTICATION</span>

                <h2>Login Activity</h2>
              </div>

              <KeyRound size={23} />
            </div>

            <div className="security-detail-list">
              <div>
                <span>Last Successful Login</span>

                <strong>
                  {formatDate(securityMetrics.lastSuccessfulLogin?.created_at)}
                </strong>
              </div>

              <div>
                <span>Last Failed Login</span>

                <strong>
                  {formatDate(securityMetrics.lastFailedLogin?.created_at)}
                </strong>
              </div>

              <div>
                <span>Last Logout</span>

                <strong>
                  {formatDate(securityMetrics.lastLogout?.created_at)}
                </strong>
              </div>

              <div>
                <span>Auth Events Loaded</span>

                <strong>{securityMetrics.authenticationEvents.length}</strong>
              </div>
            </div>
          </article>

          <article className="security-panel">
            <div className="security-panel-heading">
              <div>
                <span>SECURITY WINDOW</span>

                <h2>Recent Risk Activity</h2>
              </div>

              <ShieldAlert size={23} />
            </div>

            <div className="security-detail-list">
              <div>
                <span>Loaded Events</span>

                <strong>{auditLogs.length}</strong>
              </div>

              <div>
                <span>Failed Events</span>

                <strong>{securityMetrics.loadedFailures.length}</strong>
              </div>

              <div>
                <span>Destructive Actions</span>

                <strong>{securityMetrics.destructiveActions.length}</strong>
              </div>

              <div>
                <span>Authentication Alerts</span>

                <strong>{securityMetrics.failedLogins.length}</strong>
              </div>
            </div>
          </article>
        </section>

        <section className="security-panel security-audit-panel">
          <div className="security-panel-heading">
            <div>
              <span>AUDIT TRAIL</span>

              <h2>Recent Admin Events</h2>
            </div>

            <Clock3 size={23} />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {[
              ["all", "All Events"],
              ["authentication", "Authentication"],
              ["failures", "Failures"],
              ["destructive", "Sensitive Actions"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="admin-page-refresh"
                onClick={() => setEventFilter(value)}
                disabled={eventFilter === value}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="security-audit-list">
            {filteredAuditLogs.length === 0 ? (
              <div className="security-empty">
                No audit events match this filter.
              </div>
            ) : (
              filteredAuditLogs.map((entry) => {
                const failed = Number(entry.status_code) >= 400;

                const loginFailed = entry.action === "admin.login_failed";

                const destructive = isDestructiveEvent(entry);

                const dotClass =
                  failed || loginFailed || destructive ? "error" : "session";

                return (
                  <div className="security-audit-row" key={entry.id}>
                    <span className={`audit-dot ${dotClass}`} />

                    <div className="security-audit-content">
                      <strong>
                        {formatAction(entry.action)}

                        {entry.resource_id ? ` #${entry.resource_id}` : ""}
                      </strong>

                      <small>
                        {entry.admin_email || "Admin"}

                        {" · "}

                        {entry.http_method}

                        {" · "}

                        {entry.status_code}

                        {" · "}

                        {formatDate(entry.created_at)}
                      </small>

                      <small>{entry.request_path}</small>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="security-note">
            Audit activity is stored centrally in PostgreSQL. Passwords,
            authentication tokens and request bodies are not displayed here.
          </p>
        </section>
      </div>
    </main>
  );
}

export default AdminSecurity;
