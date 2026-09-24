import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/api.js";
import "./StudentDetails.css";
const avatarIcons = {
  avatar1: "🧭",
  avatar2: "⭐",
  avatar3: "🛡️",
  avatar4: "🔎",
};

function getStudent(data) {
  return data?.student || data?.details || data?.data || data;
}

function formatDate(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function StudentDetails() {
  const { studentId } = useParams();

  const navigate = useNavigate();

  const [student, setStudent] = useState(null);

  const [loading, setLoading] = useState(true);

  const [changing, setChanging] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [deleteNickname, setDeleteNickname] = useState("");

  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [error, setError] = useState("");

  const [deleteError, setDeleteError] = useState("");

  async function loadStudent() {
    try {
      setError("");

      const response = await api.get(`/admin/students/${studentId}`, {
        params: {
          _ts: Date.now(),
        },
      });

      setStudent(getStudent(response.data));
    } catch (err) {
      console.error("Student details error:", err);

      if (err.response?.status === 401) {
        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      if (err.response?.status === 404) {
        setError("Student not found.");

        return;
      }

      setError(
        err.response?.data?.message || "Could not load student details.",
      );
    }
  }

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        await loadStudent();
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
  }, [studentId]);

  async function toggleStudent() {
    if (!student) {
      return;
    }

    const action = student.is_enabled ? "disable" : "enable";

    const confirmed = window.confirm(
      `${action === "disable" ? "Disable" : "Enable"} ${student.nickname}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setChanging(true);
      setError("");

      await api.patch(`/admin/students/${student.id}/${action}`);

      await loadStudent();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      setError(err.response?.data?.message || "Could not update student.");
    } finally {
      setChanging(false);
    }
  }

  function openDeleteModal() {
    if (!student || student.is_enabled) {
      return;
    }

    setDeleteNickname("");
    setDeleteConfirmation("");
    setDeleteError("");
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    if (deleting) {
      return;
    }

    setDeleteModalOpen(false);

    setDeleteNickname("");
    setDeleteConfirmation("");
    setDeleteError("");
  }

  async function permanentlyDeleteStudent() {
    if (!student) {
      return;
    }

    if (student.is_enabled) {
      setDeleteError(
        "Disable the student before permanently deleting the account.",
      );

      return;
    }

    if (deleteNickname !== student.nickname) {
      setDeleteError("The nickname does not match.");

      return;
    }

    if (deleteConfirmation !== "DELETE") {
      setDeleteError('Type "DELETE" exactly.');

      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      await api.delete(`/admin/students/${student.id}/permanent`, {
        data: {
          nickname: deleteNickname,

          confirmation: deleteConfirmation,
        },
      });

      navigate("/admin/students", {
        replace: true,
      });
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      setDeleteError(
        err.response?.data?.message || "Could not permanently delete student.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const deleteReady =
    Boolean(student) &&
    student.is_enabled === false &&
    deleteNickname === student.nickname &&
    deleteConfirmation === "DELETE";

  if (loading) {
    return (
      <main className="student-details-page">
        <div className="student-details-state">
          <div className="student-details-spinner" />

          <h2>Loading student...</h2>
        </div>
      </main>
    );
  }

  if (error && !student) {
    return (
      <main className="student-details-page">
        <div className="student-details-state">
          <span>⚠️</span>

          <h2>{error}</h2>

          <Link to="/admin/students">Back to Students</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="student-details-page">
      <div className="student-details-container">
        <Link to="/admin/students" className="student-details-back">
          ← Student Management
        </Link>

        <section className="student-details-hero">
          <div className="student-details-avatar">
            {avatarIcons[student?.avatar] || "🧭"}
          </div>

          <div>
            <span>STUDENT PROFILE</span>

            <h1>{student?.nickname}</h1>

            <p>Student ID #{student?.id}</p>
          </div>

          <span
            className={`student-details-status ${
              student?.is_enabled ? "enabled" : "disabled"
            }`}
          >
            {student?.is_enabled ? "Enabled" : "Disabled"}
          </span>
        </section>

        {error && <div className="student-details-error">⚠️ {error}</div>}

        <section className="student-detail-stats">
          <article>
            <span>🎂</span>

            <strong>{student?.age_group || "—"}</strong>

            <p>Age Group</p>
          </article>

          <article>
            <span>⭐</span>

            <strong>{Number(student?.total_points) || 0}</strong>

            <p>Total Points</p>
          </article>

          <article>
            <span>🏆</span>

            <strong>{student?.current_level || "Digital Explorer"}</strong>

            <p>Current Level</p>
          </article>
        </section>

        <section className="student-account-details">
          <div className="student-details-heading">
            <span>ACCOUNT INFORMATION</span>

            <h2>Student Activity</h2>
          </div>

          <div className="student-details-rows">
            <div>
              <span>Nickname</span>

              <strong>{student?.nickname}</strong>
            </div>

            <div>
              <span>Avatar</span>

              <strong>{student?.avatar}</strong>
            </div>

            <div>
              <span>Created</span>

              <strong>{formatDate(student?.created_at)}</strong>
            </div>

            <div>
              <span>Last Login</span>

              <strong>{formatDate(student?.last_login_at)}</strong>
            </div>

            <div>
              <span>Last Active</span>

              <strong>{formatDate(student?.last_active_at)}</strong>
            </div>
          </div>
        </section>

        <section className="student-access-control">
          <div>
            <span>🔐</span>

            <div>
              <h2>Account Access</h2>

              <p>
                Disabled children cannot continue using protected Amanak
                features until the administrator enables the account again.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={student?.is_enabled ? "disable" : "enable"}
            disabled={changing}
            onClick={toggleStudent}
          >
            {changing
              ? "Updating..."
              : student?.is_enabled
                ? "Disable Student"
                : "Enable Student"}
          </button>
        </section>

        <section className="student-danger-zone">
          <div className="student-danger-content">
            <div className="student-danger-icon">⚠️</div>

            <div>
              <span className="student-danger-label">DANGER ZONE</span>

              <h2>Permanently Delete Student</h2>

              <p>
                Permanently deleting this student removes the account and
                associated data. This action cannot be undone.
              </p>

              {student?.is_enabled && (
                <div className="student-danger-warning">
                  Disable this student before permanent deletion is allowed.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="student-permanent-delete-button"
            disabled={student?.is_enabled || deleting}
            onClick={openDeleteModal}
          >
            Delete Permanently
          </button>
        </section>
      </div>

      {deleteModalOpen && (
        <div
          className="student-delete-modal-backdrop"
          onMouseDown={closeDeleteModal}
        >
          <section
            className="student-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="student-delete-modal-icon">⚠️</div>

            <h2 id="student-delete-title">Permanently Delete Student</h2>

            <p>
              You are about to permanently delete{" "}
              <strong>{student?.nickname}</strong>. This cannot be undone.
            </p>

            <label>
              Enter the student's nickname:
              <strong> {student?.nickname}</strong>
              <input
                type="text"
                value={deleteNickname}
                onChange={(event) => {
                  setDeleteNickname(event.target.value);

                  setDeleteError("");
                }}
                placeholder={student?.nickname || ""}
                autoComplete="off"
              />
            </label>

            <label>
              Type <strong>DELETE</strong> to confirm
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(event) => {
                  setDeleteConfirmation(event.target.value);

                  setDeleteError("");
                }}
                placeholder="DELETE"
                autoComplete="off"
              />
            </label>

            {deleteError && (
              <div className="student-delete-modal-error">⚠️ {deleteError}</div>
            )}

            <div className="student-delete-modal-actions">
              <button
                type="button"
                className="student-delete-cancel"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="student-delete-confirm"
                onClick={permanentlyDeleteStudent}
                disabled={!deleteReady || deleting}
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default StudentDetails;