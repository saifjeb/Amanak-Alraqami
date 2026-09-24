import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";
import AdminNav from "../../components/admin/AdminNav.jsx";
import { getAdventureFallbackCover } from "../../utils/adventureVisuals.js";
import "./AdventureManagement.css";

const emptyForm = {
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  icon: "lock",
  badge_name: "",
  completion_points: 50,
  display_order: 1,
  is_active: true,
};


function extractArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  const possibilities = [
    data?.adventures,
    data?.media,
    data?.trash,
    data?.items,
    data?.files,
    data?.data,
  ];

  return possibilities.find(Array.isArray) || [];
}

function getMediaUrl(path) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const serverUrl = apiUrl.replace(/\/api\/?$/, "");

  return `${serverUrl}${path}`;
}

function AdventureManagement() {
  const navigate = useNavigate();

  const [adventures, setAdventures] = useState([]);

  const [trash, setTrash] = useState([]);

  const [loading, setLoading] = useState(true);

  const [workingId, setWorkingId] = useState(null);

  const [currentView, setCurrentView] = useState("active");

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [formOpen, setFormOpen] = useState(false);

  const [editingAdventure, setEditingAdventure] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  const [imageModalOpen, setImageModalOpen] = useState(false);

  const [imageTarget, setImageTarget] = useState(null);

  const [media, setMedia] = useState([]);

  const [loadingMedia, setLoadingMedia] = useState(false);

  const [assigningMediaId, setAssigningMediaId] = useState(null);

  const handleUnauthorized = useCallback(() => {
    navigate("/admin/login", {
      replace: true,
    });
  }, [navigate]);

  const loadData = useCallback(async () => {
    try {
      setError("");

      const [activeResponse, trashResponse] = await Promise.all([
        api.get("/admin/adventures"),

        api.get("/admin/trash/adventures"),
      ]);

      setAdventures(extractArray(activeResponse.data));

      setTrash(extractArray(trashResponse.data));
    } catch (err) {
      console.error("Adventure load error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      setError(err.response?.data?.message || "Could not load adventures.");
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        await loadData();
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
  }, [loadData]);

  const displayedItems = useMemo(() => {
    const source = currentView === "trash" ? trash : adventures;

    const query = search.trim().toLowerCase();

    return source
      .filter((adventure) => {
        if (!query) {
          return true;
        }

        return (
          String(adventure.title_en || "")
            .toLowerCase()
            .includes(query) ||
          String(adventure.title_ar || "")
            .toLowerCase()
            .includes(query) ||
          String(adventure.badge_name || "")
            .toLowerCase()
            .includes(query)
        );
      })
      .sort(
        (a, b) => Number(a.display_order || 0) - Number(b.display_order || 0),
      );
  }, [adventures, trash, search, currentView]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function openCreate() {
    clearMessages();

    const nextOrder =
      adventures.length > 0
        ? Math.max(
            ...adventures.map((item) => Number(item.display_order) || 0),
          ) + 1
        : 1;

    setEditingAdventure(null);

    setForm({
      ...emptyForm,
      display_order: nextOrder,
    });

    setFormOpen(true);
  }

  function openEdit(adventure) {
    clearMessages();

    setEditingAdventure(adventure);

    setForm({
      title_ar: adventure.title_ar || "",

      title_en: adventure.title_en || "",

      description_ar: adventure.description_ar || "",

      description_en: adventure.description_en || "",

      icon: adventure.icon || "lock",

      badge_name: adventure.badge_name || "",

      completion_points: Number(adventure.completion_points) || 0,

      display_order: Number(adventure.display_order) || 1,

      is_active: adventure.is_active !== false,
    });

    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);

    setEditingAdventure(null);
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,

      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  }

  function validateForm() {
    if (form.title_ar.trim().length < 2) {
      return "Arabic title must contain at least 2 characters.";
    }

    if (form.title_en.trim().length < 2) {
      return "English title must contain at least 2 characters.";
    }

    if (Number(form.display_order) < 1) {
      return "Display order must be at least 1.";
    }

    if (Number(form.completion_points) < 0) {
      return "Completion points cannot be negative.";
    }

    return "";
  }

  async function saveAdventure(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);

      return;
    }

    const payload = {
      title_ar: form.title_ar.trim(),

      title_en: form.title_en.trim(),

      description_ar: form.description_ar.trim(),

      description_en: form.description_en.trim(),

      icon: form.icon.trim(),

      badge_name: form.badge_name.trim(),

      completion_points: Number(form.completion_points),

      display_order: Number(form.display_order),

      is_active: Boolean(form.is_active),
    };

    try {
      setSaving(true);
      clearMessages();

      if (editingAdventure) {
        await api.put(`/admin/adventures/${editingAdventure.id}`, payload);

        setSuccess("Adventure updated successfully.");
      } else {
        await api.post("/admin/adventures", payload);

        setSuccess("Adventure created successfully.");
      }

      setFormOpen(false);

      setEditingAdventure(null);

      await loadData();
    } catch (err) {
      console.error("Save adventure error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      if (err.response?.status === 409) {
        setError(
          err.response?.data?.message ||
            "Another adventure may already use this title or display order.",
        );

        return;
      }

      setError(err.response?.data?.message || "Could not save adventure.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(adventure) {
    const nextStatus = !adventure.is_active;

    try {
      setWorkingId(adventure.id);

      clearMessages();

      await api.put(`/admin/adventures/${adventure.id}`, {
        is_active: nextStatus,
      });

      setSuccess(
        nextStatus ? "Adventure activated." : "Adventure deactivated.",
      );

      await loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      setError(
        err.response?.data?.message || "Could not update adventure status.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function moveToTrash(adventure) {
    const confirmed = window.confirm(`Move "${adventure.title_en}" to trash?`);

    if (!confirmed) {
      return;
    }

    try {
      setWorkingId(adventure.id);

      clearMessages();

      await api.delete(`/admin/adventures/${adventure.id}`);

      setSuccess("Adventure moved to trash.");

      await loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      setError(
        err.response?.data?.message || "Could not move adventure to trash.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function restoreAdventure(adventure) {
    try {
      setWorkingId(adventure.id);

      clearMessages();

      await api.patch(`/admin/trash/adventures/${adventure.id}/restore`);

      setSuccess("Adventure restored successfully.");

      await loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      setError(err.response?.data?.message || "Could not restore adventure.");
    } finally {
      setWorkingId(null);
    }
  }

  async function permanentlyDelete(adventure) {
    const confirmation = window.prompt(
      `Permanent deletion cannot be undone.\n\nType DELETE to permanently remove "${adventure.title_en}".`,
    );

    if (confirmation !== "DELETE") {
      return;
    }

    try {
      setWorkingId(adventure.id);

      clearMessages();

      await api.delete(`/admin/trash/adventures/${adventure.id}/permanent`);

      setSuccess("Adventure permanently deleted.");

      await loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      if (err.response?.status === 409) {
        setError(
          err.response?.data?.message ||
            "This adventure cannot be permanently deleted because related data exists.",
        );

        return;
      }

      setError(
        err.response?.data?.message ||
          "Could not permanently delete adventure.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function openImagePicker(adventure) {
    setImageTarget(adventure);

    setImageModalOpen(true);

    setLoadingMedia(true);

    clearMessages();

    try {
      const response = await api.get("/admin/media");

      setMedia(extractArray(response.data));
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      setError(err.response?.data?.message || "Could not load media library.");
    } finally {
      setLoadingMedia(false);
    }
  }

  async function assignImage(mediaId) {
    if (!imageTarget) {
      return;
    }

    try {
      setAssigningMediaId(mediaId);

      clearMessages();

      await api.patch(`/admin/adventures/${imageTarget.id}/image`, {
        media_id: Number(mediaId),
      });

      setSuccess("Adventure image updated.");

      setImageModalOpen(false);

      setImageTarget(null);

      await loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      setError(err.response?.data?.message || "Could not assign image.");
    } finally {
      setAssigningMediaId(null);
    }
  }

  if (loading) {
    return (
      <main className="adventure-admin-page">
        <div className="adventure-admin-loading">
          <div className="adventure-admin-spinner" />

          <h2>Loading adventures...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="adventure-admin-page">
      <AdminNav />

      <div className="adventure-admin-container">
        <section className="adventure-admin-hero">
          <div>
            <span>CONTENT MANAGEMENT</span>

            <h1>Adventure Management</h1>

            <p>
              Create and manage Amanak's digital safety learning adventures.
            </p>
          </div>

          <button type="button" onClick={openCreate}>
            + Create Adventure
          </button>
        </section>

        <section className="adventure-admin-stats">
          <article>
            <span>🧭</span>

            <strong>{adventures.length}</strong>

            <p>Adventures</p>
          </article>

          <article>
            <span>✅</span>

            <strong>
              {adventures.filter((item) => item.is_active).length}
            </strong>

            <p>Active</p>
          </article>

          <article>
            <span>⏸️</span>

            <strong>
              {adventures.filter((item) => !item.is_active).length}
            </strong>

            <p>Inactive</p>
          </article>

          <article>
            <span>🗑️</span>

            <strong>{trash.length}</strong>

            <p>Trash</p>
          </article>
        </section>

        <section className="adventure-toolbar">
          <div className="adventure-tabs">
            <button
              type="button"
              className={currentView === "active" ? "selected" : ""}
              onClick={() => setCurrentView("active")}
            >
              Adventures
            </button>

            <button
              type="button"
              className={currentView === "trash" ? "selected danger" : ""}
              onClick={() => setCurrentView("trash")}
            >
              Trash ({trash.length})
            </button>
          </div>

          <input
            type="search"
            placeholder="Search adventures..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </section>

        {error && (
          <div className="adventure-message error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="adventure-message success" role="status">
            ✅ {success}
          </div>
        )}

        {displayedItems.length === 0 ? (
          <section className="adventure-empty">
            <span>{currentView === "trash" ? "🗑️" : "🧭"}</span>

            <h2>
              {currentView === "trash"
                ? "Trash is empty"
                : "No adventures found"}
            </h2>
          </section>
        ) : (
          <section className="admin-adventure-grid">
            {displayedItems.map((adventure) => {
              const fallbackCover = getAdventureFallbackCover(adventure);
              const imageUrl =
                getMediaUrl(adventure.image_url) ||
                (adventure.image_media_id
                  ? getMediaUrl(`/api/media/${adventure.image_media_id}`)
                  : fallbackCover);

              return (
                <article className="admin-adventure-card" key={adventure.id}>
                  <div className="admin-adventure-image">
                    <img
                      src={imageUrl || fallbackCover}
                      alt={adventure.title_en || adventure.title_ar || "Adventure cover"}
                      loading="lazy"
                      onError={(event) => {
                        if (event.currentTarget.src !== fallbackCover) event.currentTarget.src = fallbackCover;
                      }}
                    />

                    <div className="admin-order-badge">
                      #{adventure.display_order}
                    </div>
                  </div>

                  <div className="admin-adventure-content">
                    <div className="admin-adventure-title-row">
                      <div>
                        <h2>{adventure.title_en}</h2>

                        <h3 dir="rtl">{adventure.title_ar}</h3>
                      </div>

                      {currentView === "active" && (
                        <span
                          className={`admin-active-badge ${
                            adventure.is_active ? "active" : "inactive"
                          }`}
                        >
                          {adventure.is_active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>

                    <p>
                      {adventure.description_en || "No English description."}
                    </p>

                    <div className="admin-adventure-meta">
                      <span>
                        ⭐ {Number(adventure.completion_points) || 0} pts
                      </span>

                      <span>🏆 {adventure.badge_name || "No badge"}</span>
                    </div>

                    {currentView === "active" ? (
                      <div className="admin-adventure-actions">
                        <button
                          type="button"
                          className="edit"
                          onClick={() => openEdit(adventure)}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          className="image"
                          onClick={() => openImagePicker(adventure)}
                        >
                          🖼️ Image
                        </button>

                        <button
                          type="button"
                          className={
                            adventure.is_active ? "deactivate" : "activate"
                          }
                          disabled={workingId === adventure.id}
                          onClick={() => toggleActive(adventure)}
                        >
                          {adventure.is_active ? "⏸ Deactivate" : "▶ Activate"}
                        </button>

                        <button
                          type="button"
                          className="trash"
                          disabled={workingId === adventure.id}
                          onClick={() => moveToTrash(adventure)}
                        >
                          🗑️ Trash
                        </button>
                      </div>
                    ) : (
                      <div className="admin-adventure-actions">
                        <button
                          type="button"
                          className="restore"
                          disabled={workingId === adventure.id}
                          onClick={() => restoreAdventure(adventure)}
                        >
                          ↩ Restore
                        </button>

                        <button
                          type="button"
                          className="permanent"
                          disabled={workingId === adventure.id}
                          onClick={() => permanentlyDelete(adventure)}
                        >
                          ⛔ Delete Forever
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {formOpen && (
        <div className="admin-modal-backdrop">
          <section className="admin-adventure-modal">
            <header>
              <div>
                <span>{editingAdventure ? "EDIT CONTENT" : "NEW CONTENT"}</span>

                <h2>
                  {editingAdventure ? "Edit Adventure" : "Create Adventure"}
                </h2>
              </div>

              <button type="button" onClick={closeForm}>
                ×
              </button>
            </header>

            <form onSubmit={saveAdventure}>
              <div className="admin-form-grid">
                <label>
                  English Title *
                  <input
                    name="title_en"
                    value={form.title_en}
                    onChange={handleFormChange}
                    maxLength={150}
                  />
                </label>

                <label>
                  Arabic Title *
                  <input
                    name="title_ar"
                    value={form.title_ar}
                    onChange={handleFormChange}
                    maxLength={150}
                    dir="rtl"
                  />
                </label>

                <label className="full">
                  English Description
                  <textarea
                    name="description_en"
                    value={form.description_en}
                    onChange={handleFormChange}
                    rows={3}
                  />
                </label>

                <label className="full">
                  Arabic Description
                  <textarea
                    name="description_ar"
                    value={form.description_ar}
                    onChange={handleFormChange}
                    rows={3}
                    dir="rtl"
                  />
                </label>

                <label>
                  Icon
                  <select
                    name="icon"
                    value={form.icon}
                    onChange={handleFormChange}
                  >
                    <option value="lock">🔐 Lock</option>

                    <option value="link">🔗 Link</option>

                    <option value="user">👤 User</option>

                    <option value="message">💬 Message</option>

                    <option value="camera">📷 Camera</option>

                    <option value="help">🆘 Help</option>
                  </select>
                </label>

                <label>
                  Badge Name
                  <input
                    name="badge_name"
                    value={form.badge_name}
                    onChange={handleFormChange}
                    maxLength={100}
                  />
                </label>

                <label>
                  Completion Points
                  <input
                    name="completion_points"
                    type="number"
                    min="0"
                    value={form.completion_points}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Display Order *
                  <input
                    name="display_order"
                    type="number"
                    min="1"
                    value={form.display_order}
                    onChange={handleFormChange}
                  />
                </label>
              </div>

              <label className="admin-active-checkbox">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleFormChange}
                />

                <span>Adventure is active and available to children</span>
              </label>

              {error && (
                <div className="adventure-message error">⚠️ {error}</div>
              )}

              <footer>
                <button type="button" className="cancel" onClick={closeForm}>
                  Cancel
                </button>

                <button type="submit" className="save" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingAdventure
                      ? "Save Changes"
                      : "Create Adventure"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {imageModalOpen && (
        <div className="admin-modal-backdrop">
          <section className="admin-media-picker">
            <header>
              <div>
                <span>IMAGE LIBRARY</span>

                <h2>Choose Adventure Image</h2>

                <p>{imageTarget?.title_en}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setImageModalOpen(false);

                  setImageTarget(null);
                }}
              >
                ×
              </button>
            </header>

            {loadingMedia ? (
              <div className="media-picker-loading">Loading media...</div>
            ) : media.length === 0 ? (
              <div className="media-picker-empty">
                <span>🖼️</span>

                <p>No media uploaded yet.</p>

                <Link to="/admin/media">Open Media Manager</Link>
              </div>
            ) : (
              <div className="admin-media-picker-grid">
                {media.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => assignImage(item.id)}
                    disabled={assigningMediaId !== null}
                  >
                    <img
                      src={getMediaUrl(`/api/media/${item.id}`)}
                      alt={item.original_name || "Media"}
                    />

                    <span>{item.original_name || `Media #${item.id}`}</span>

                    {assigningMediaId === item.id && (
                      <small>Assigning...</small>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default AdventureManagement;
