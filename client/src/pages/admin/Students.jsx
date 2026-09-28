import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { api } from "../../api/api.js";
import AdminNav from "../../components/admin/AdminNav.jsx";
import AvatarPortrait from "../../components/common/AvatarPortrait.jsx";

import "./Students.css";

function extractStudents(data) {
  if (Array.isArray(data)) {
    return data;
  }

  const possibleArrays = [
    data?.students,
    data?.statuses,
    data?.users,
    data?.data,
  ];

  return possibleArrays.find(Array.isArray) || [];
}

function formatDate(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function Students() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    total_students: 0,
    disabled: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [changingId, setChangingId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");

  const [error, setError] = useState("");

  const loadStudents = useCallback(async ({ refresh = false } = {}) => {
    const startedAt = Date.now();

    try {

      const response = await api.get("/admin/students/status", {
        params: {
          page: 1,
          limit: 100,
          _ts: Date.now(),
        },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      setError("");
      const nextStudents = extractStudents(response.data);
      const serverSummary = response.data?.summary || {};

      setStudents(nextStudents);

      setSummary({
        ...serverSummary,
        total_students: Number(
          serverSummary.total_students ?? nextStudents.length,
        ),
        disabled: Number(
          serverSummary.disabled ??
            nextStudents.filter(
              (student) => student.is_enabled === false,
            ).length,
        ),
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Load students error:", err);

      if (err.response?.status === 401) {
        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      setError(
        err.response?.data?.message ||
          "Could not load students.",
      );
    } finally {
      if (refresh) {
        const elapsed = Date.now() - startedAt;
        const minimumVisibleTime = 600;

        if (elapsed < minimumVisibleTime) {
          await new Promise((resolve) => {
            setTimeout(resolve, minimumVisibleTime - elapsed);
          });
        }

        setRefreshing(false);
      }
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        await loadStudents();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    start();

    return () => {
      active = false;
    };
  }, [loadStudents]);

  async function handleRefresh() {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    setError("");

    await loadStudents({
      refresh: true,
    });
  }

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        String(student.nickname || "")
          .toLowerCase()
          .includes(query) ||
        String(student.id).includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "enabled" &&
          student.is_enabled === true) ||
        (statusFilter === "disabled" &&
          student.is_enabled === false);

      const matchesAge =
        ageFilter === "all" ||
        student.age_group === ageFilter;

      return matchesSearch && matchesStatus && matchesAge;
    });
  }, [students, search, statusFilter, ageFilter]);

  const totalCount = Number(summary.total_students) || 0;
  const disabledCount = Number(summary.disabled) || 0;
  const enabledCount = Math.max(0, totalCount - disabledCount);

  async function changeStatus(student) {
    const shouldEnable = student.is_enabled === false;
    const action = shouldEnable ? "enable" : "disable";

    const message = shouldEnable
      ? `Enable ${student.nickname}'s account?`
      : `Disable ${student.nickname}'s account? The child will immediately lose access.`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      setChangingId(student.id);
      setError("");

      const response = await api.patch(
        `/admin/students/${student.id}/${action}`,
      );

      const updatedStudent = response.data?.student;

      setStudents((currentStudents) =>
        currentStudents.map((item) => {
          if (Number(item.id) !== Number(student.id)) {
            return item;
          }

          return {
            ...item,
            ...(updatedStudent || {}),
            is_enabled:
              typeof updatedStudent?.is_enabled === "boolean"
                ? updatedStudent.is_enabled
                : shouldEnable,
          };
        }),
      );

      setSummary((currentSummary) => {
        const currentDisabled =
          Number(currentSummary.disabled) || 0;

        return {
          ...currentSummary,
          disabled: Math.max(
            0,
            currentDisabled + (shouldEnable ? -1 : 1),
          ),
        };
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Student status error:", err);

      if (err.response?.status === 401) {
        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      setError(
        err.response?.data?.message ||
          `Could not ${action} student.`,
      );
    } finally {
      setChangingId(null);
    }
  }

  if (loading) {
    return (
      <main className="students-page">
        <div className="students-loading">
          <div className="students-spinner" />
          <h2>Loading students...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="students-page">
      <AdminNav />

      <div className="students-container">
        <section className="students-hero">
          <div>
            <span>STUDENT MANAGEMENT</span>
            <h1>Manage Students</h1>
            <p>
              Review child accounts, activity, points and account access.
            </p>
          </div>

          <div className="students-hero-icon">👥</div>
        </section>

        <section
          className="student-summary-grid"
          aria-live="polite"
        >
          <article>
            <span>👧</span>
            <strong>{totalCount}</strong>
            <p>Total Students</p>
          </article>

          <article>
            <span>✅</span>
            <strong>{enabledCount}</strong>
            <p>Enabled</p>
          </article>

          <article>
            <span>⛔</span>
            <strong>{disabledCount}</strong>
            <p>Disabled</p>
          </article>
        </section>

        <section className="student-filter-card">
          <div className="student-search">
            <span>🔎</span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by nickname or ID..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All Statuses</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>

          <select
            value={ageFilter}
            onChange={(event) =>
              setAgeFilter(event.target.value)
            }
          >
            <option value="all">All Ages</option>
            <option value="8-10">Age 8–10</option>
            <option value="11-14">Age 11–14</option>
          </select>

          <button
            type="button"
            className="students-refresh-button"
            onClick={handleRefresh}
            disabled={refreshing || changingId !== null}
            aria-busy={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "students-refresh-spin"
                  : ""
              }
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {lastUpdated && !refreshing && (
            <small
              className="students-last-updated"
              aria-live="polite"
            >
              ✓ Updated {lastUpdated.toLocaleTimeString()}
            </small>
          )}
        </section>

        {error && (
          <div className="students-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <section className="students-table-card">
          <div className="students-table-heading">
            <div>
              <span>ACCOUNTS</span>
              <h2>Students</h2>
            </div>

            <strong>{filteredStudents.length} shown</strong>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="students-empty">
              <span>🔍</span>
              <h3>No students found</h3>
              <p>Try changing the search or filter.</p>
            </div>
          ) : (
            <div className="students-table-scroll">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Age</th>
                    <th>Points</th>
                    <th>Level</th>
                    <th>Last Active</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="student-name-cell">
                          <AvatarPortrait
                            avatar={student.avatar}
                            size="md"
                            className="student-table-avatar"
                          />

                          <div>
                            <strong>{student.nickname}</strong>
                            <small>ID #{student.id}</small>
                          </div>
                        </div>
                      </td>

                      <td>{student.age_group}</td>

                      <td>
                        <strong className="student-points">
                          ⭐ {Number(student.total_points) || 0}
                        </strong>
                      </td>

                      <td>
                        {student.current_level || "Digital Explorer"}
                      </td>

                      <td>
                        <span
                          className="student-date"
                          title={student.last_active_at || ""}
                        >
                          {formatDate(student.last_active_at)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`student-status ${
                            student.is_enabled
                              ? "enabled"
                              : "disabled"
                          }`}
                        >
                          {student.is_enabled
                            ? "● Enabled"
                            : "● Disabled"}
                        </span>
                      </td>

                      <td>
                        <div className="student-actions">
                          <Link
                            to={`/admin/students/${student.id}`}
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            className={
                              student.is_enabled
                                ? "disable"
                                : "enable"
                            }
                            onClick={() =>
                              changeStatus(student)
                            }
                            disabled={changingId === student.id}
                          >
                            {changingId === student.id
                              ? "..."
                              : student.is_enabled
                                ? "Disable"
                                : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Students;
