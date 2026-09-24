import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";
import AdminNav from "../../components/admin/AdminNav.jsx";
import "./MediaManagement.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function extractMedia(data) {
  if (Array.isArray(data)) {
    return data;
  }

  const possibleArrays = [
    data?.media,
    data?.items,
    data?.files,
    data?.trash,
    data?.data,
  ];

  return possibleArrays.find(Array.isArray) || [];
}

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
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

function resolveMediaUrl(item) {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const serverUrl = apiUrl.replace(/\/api\/?$/, "");
  const candidate = item?.image_url || item?.public_url || item?.url;

  if (candidate) {
    if (/^https?:\/\//.test(candidate)) return candidate;
    return `${serverUrl}${candidate.startsWith("/") ? "" : "/"}${candidate}`;
  }

  return item?.id ? `${serverUrl}/api/media/${item.id}` : "";
}

function markImageUnavailable(event) {
  const image = event.currentTarget;
  image.hidden = true;
  image.parentElement?.classList.add("is-unavailable");
}

function MediaManagement() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [media, setMedia] = useState([]);
  const [trash, setTrash] = useState([]);
  const [currentView, setCurrentView] = useState("active");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const handleUnauthorized = useCallback(() => {
    navigate("/admin/login", {
      replace: true,
    });
  }, [navigate]);

  const loadMedia = useCallback(async () => {
    try {
      setError("");

      const [mediaResponse, trashResponse] = await Promise.all([
        api.get("/admin/media"),

        api.get("/admin/trash/media"),
      ]);
      setMedia(extractMedia(mediaResponse.data));
      setTrash(extractMedia(trashResponse.data));
    } catch (err) {
      console.error("Load media error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Could not load media.");
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        await loadMedia();
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
  }, [loadMedia]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayedMedia = useMemo(() => {
    const source = currentView === "trash" ? trash : media;

    const query = search.trim().toLowerCase();

    return source.filter((item) => {
      if (!query) {
        return true;
      }

      return (
        String(item.original_name || "")
          .toLowerCase()
          .includes(query) ||
        String(item.mime_type || "")
          .toLowerCase()
          .includes(query) ||
        String(item.id).includes(query)
      );
    });
  }, [media, trash, currentView, search]);

  const totalSize = useMemo(() => {
    return media.reduce((sum, item) => sum + Number(item.file_size || 0), 0);
  }, [media]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function clearSelectedFile() {
    setSelectedFile(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event) {
    clearMessages();

    const file = event.target.files?.[0];

    if (!file) {
      clearSelectedFile();
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PNG, JPEG and WEBP images are allowed.");

      event.target.value = "";

      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must not exceed 5 MB.");

      event.target.value = "";

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadMedia() {
    if (!selectedFile) {
      setError("Choose an image first.");

      return;
    }

    try {
      setUploading(true);
      clearMessages();

      const formData = new FormData();

      formData.append("image", selectedFile);

      await api.post("/admin/media/upload", formData);

      setSuccess("Image uploaded successfully.");

      clearSelectedFile();

      await loadMedia();
    } catch (err) {
      console.error("Upload media error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (err.response?.status === 413) {
        setError("The selected image is too large.");

        return;
      }

      setError(err.response?.data?.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  async function moveToTrash(item) {
    const confirmed = window.confirm(`Move "${item.original_name}" to trash?`);

    if (!confirmed) {
      return;
    }

    try {
      setWorkingId(item.id);

      clearMessages();

      await api.delete(`/admin/media/${item.id}`);

      setSuccess("Media moved to trash.");

      await loadMedia();
    } catch (err) {
      console.error("Trash media error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Could not move media to trash.");
    } finally {
      setWorkingId(null);
    }
  }

  async function restoreMedia(item) {
    try {
      setWorkingId(item.id);

      clearMessages();

      await api.patch(`/admin/trash/media/${item.id}/restore`);

      setSuccess("Media restored successfully.");

      await loadMedia();
    } catch (err) {
      console.error("Restore media error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Could not restore media.");
    } finally {
      setWorkingId(null);
    }
  }

  async function permanentlyDelete(item) {
    const value = window.prompt(
      `This permanently removes the image.\n\nType DELETE to permanently remove "${item.original_name}".`,
    );

    if (value !== "DELETE") {
      return;
    }

    try {
      setWorkingId(item.id);

      clearMessages();

      await api.delete(`/admin/trash/media/${item.id}/permanent`);

      setSuccess("Media permanently deleted.");

      await loadMedia();
    } catch (err) {
      console.error("Permanent media delete error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (err.response?.status === 409) {
        setError(
          err.response?.data?.message ||
            "This image is still used by content and cannot be deleted.",
        );

        return;
      }

      setError(
        err.response?.data?.message || "Could not permanently delete media.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  if (loading) {
    return (
      <main className="media-admin-page">
        <div className="media-admin-loading">
          <div className="media-admin-spinner" />

          <h2>Loading media...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="media-admin-page">
      <AdminNav />

      <div className="media-admin-container">
        <section className="media-admin-hero">
          <div>
            <span>CONTENT LIBRARY</span>

            <h1>Media Management</h1>

            <p>
              Upload and manage educational images used in adventures and
              questions.
            </p>
          </div>

          <div className="media-admin-hero-icon">🖼️</div>
        </section>

        <section className="media-admin-stats">
          <article>
            <span>🖼️</span>

            <strong>{media.length}</strong>

            <p>Active Images</p>
          </article>

          <article>
            <span>💾</span>

            <strong>{formatFileSize(totalSize)}</strong>

            <p>Storage Used</p>
          </article>

          <article>
            <span>🗑️</span>

            <strong>{trash.length}</strong>

            <p>Trash</p>
          </article>
        </section>

        <section className="media-upload-card">
          <div className="media-upload-heading">
            <div>
              <span>UPLOAD MEDIA</span>

              <h2>Add New Image</h2>

              <p>PNG, JPEG or WEBP. Maximum file size: 5 MB.</p>
            </div>

            <div className="media-upload-icon">☁️</div>
          </div>

          <div className="media-upload-area">
            <input
              ref={fileInputRef}
              id="admin-media-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
            />

            <label htmlFor="admin-media-upload">
              <span>📁</span>

              <strong>Choose Image</strong>

              <small>Browse your computer</small>
            </label>

            {selectedFile && (
              <div className="selected-media-preview">
                <img src={previewUrl} alt="Selected preview" />

                <div>
                  <strong>{selectedFile.name}</strong>

                  <span>{selectedFile.type}</span>

                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>

                <button
                  type="button"
                  onClick={clearSelectedFile}
                  disabled={uploading}
                >
                  ×
                </button>
              </div>
            )}

            {selectedFile && (
              <button
                type="button"
                className="media-upload-button"
                onClick={uploadMedia}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Image ↑"}
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className="media-admin-message error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="media-admin-message success" role="status">
            ✅ {success}
          </div>
        )}

        <section className="media-toolbar">
          <div className="media-tabs">
            <button
              type="button"
              className={currentView === "active" ? "selected" : ""}
              onClick={() => {
                setCurrentView("active");

                clearMessages();
              }}
            >
              Media Library ({media.length})
            </button>

            <button
              type="button"
              className={currentView === "trash" ? "selected trash" : ""}
              onClick={() => {
                setCurrentView("trash");

                clearMessages();
              }}
            >
              Trash ({trash.length})
            </button>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search media..."
          />
        </section>

        {displayedMedia.length === 0 ? (
          <section className="media-empty-state">
            <span>{currentView === "trash" ? "🗑️" : "🖼️"}</span>

            <h2>
              {currentView === "trash"
                ? "Media trash is empty"
                : "No images uploaded yet"}
            </h2>

            <p>
              {currentView === "active"
                ? "Upload your first image above."
                : "Deleted media will appear here."}
            </p>
          </section>
        ) : (
          <section className="media-library-grid">
            {displayedMedia.map((item) => (
              <article className="media-library-card" key={item.id}>
                <div className="media-card-image">
                  <img
                    src={resolveMediaUrl(item)}
                    alt={item.original_name || "Amanak media"}
                    onError={markImageUnavailable}
                  />

                  <span className="media-id-badge">#{item.id}</span>
                </div>

                <div className="media-card-body">
                  <h3 title={item.original_name}>
                    {item.original_name || `Media ${item.id}`}
                  </h3>

                  <div className="media-file-details">
                    <span>{item.mime_type}</span>

                    <span>{formatFileSize(item.file_size)}</span>
                  </div>

                  <p>Uploaded: {formatDate(item.created_at)}</p>

                  {currentView === "trash" ? (
                    <p className="media-deleted-date">
                      Deleted: {formatDate(item.deleted_at)}
                    </p>
                  ) : null}

                  <div className="media-card-actions">
                    {currentView === "active" ? (
                      <>
                        <a
                          href={resolveMediaUrl(item)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          👁 View
                        </a>

                        <button
                          type="button"
                          className="trash"
                          disabled={workingId === item.id}
                          onClick={() => moveToTrash(item)}
                        >
                          {workingId === item.id ? "..." : "🗑 Trash"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="restore"
                          disabled={workingId === item.id}
                          onClick={() => restoreMedia(item)}
                        >
                          ↩ Restore
                        </button>

                        <button
                          type="button"
                          className="permanent"
                          disabled={workingId === item.id}
                          onClick={() => permanentlyDelete(item)}
                        >
                          ⛔ Delete Forever
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default MediaManagement;