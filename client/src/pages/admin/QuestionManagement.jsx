import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { api } from "../../api/api.js";
import AdminNav from "../../components/admin/AdminNav.jsx";

import "./QuestionManagement.css";

const emptyForm = {
  question_type: "adventure",
  adventure_id: "",
  age_group: "8-10",

  story_text_ar: "",
  story_text_en: "",

  question_ar: "",
  question_en: "",

  option_a_ar: "",
  option_a_en: "",

  option_b_ar: "",
  option_b_en: "",

  option_c_ar: "",
  option_c_en: "",

  correct_answer: "A",

  feedback_correct_ar: "",
  feedback_correct_en: "",

  feedback_wrong_ar: "",
  feedback_wrong_en: "",

  points: 10,
  display_order: 1,
};

const typeInfo = {
  adventure: {
    label: "Adventure Question",
    icon: "🧭",
  },

  pre_test: {
    label: "Pre-Test",
    icon: "🧠",
  },

  post_test: {
    label: "Post-Test",
    icon: "🎯",
  },
};

function extractArray(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
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

function markQuestionImageUnavailable(event) {
  const image = event.currentTarget;
  image.hidden = true;
  image.parentElement?.classList.add("is-unavailable");
}

function QuestionManagement() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);

  const [trash, setTrash] = useState([]);

  const [adventures, setAdventures] = useState([]);

  const [loading, setLoading] = useState(true);

  const [currentView, setCurrentView] = useState("all");

  const [search, setSearch] = useState("");

  const [ageFilter, setAgeFilter] = useState("all");

  const [adventureFilter, setAdventureFilter] = useState("all");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [workingId, setWorkingId] = useState(null);

  const [formOpen, setFormOpen] = useState(false);

  const [editingQuestion, setEditingQuestion] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  const [imageModalOpen, setImageModalOpen] = useState(false);

  const [imageTarget, setImageTarget] = useState(null);

  const [media, setMedia] = useState([]);

  const [loadingMedia, setLoadingMedia] = useState(false);

  const [assigningMediaId, setAssigningMediaId] = useState(null);

  const handleUnauthorized = useCallback(() => {
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  const loadData = useCallback(async () => {
    try {
      setError("");

      const [questionResponse, trashResponse, adventureResponse] =
        await Promise.all([
          api.get("/admin/questions"),

          api.get("/admin/trash/questions"),

          api.get("/admin/adventures"),
        ]);

      setQuestions(extractArray(questionResponse.data, ["questions"]));

      setTrash(extractArray(trashResponse.data, ["questions"]));

      setAdventures(extractArray(adventureResponse.data, ["adventures"]));
    } catch (err) {
      console.error("Question load error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Could not load questions.");
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

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  const displayedQuestions = useMemo(() => {
    const source = currentView === "trash" ? trash : questions;

    const query = search.trim().toLowerCase();

    return source.filter((question) => {
      const matchesType =
        currentView === "all" ||
        currentView === "trash" ||
        question.question_type === currentView;

      const matchesAge =
        ageFilter === "all" || question.age_group === ageFilter;

      const matchesAdventure =
        adventureFilter === "all" ||
        Number(question.adventure_id) === Number(adventureFilter);

      const matchesSearch =
        !query ||
        String(question.question_en || "")
          .toLowerCase()
          .includes(query) ||
        String(question.question_ar || "")
          .toLowerCase()
          .includes(query) ||
        String(question.adventure_title_en || "")
          .toLowerCase()
          .includes(query);

      return matchesType && matchesAge && matchesAdventure && matchesSearch;
    });
  }, [questions, trash, currentView, ageFilter, adventureFilter, search]);

  const counts = useMemo(
    () => ({
      total: questions.length,

      adventure: questions.filter((item) => item.question_type === "adventure")
        .length,

      pre: questions.filter((item) => item.question_type === "pre_test").length,

      post: questions.filter((item) => item.question_type === "post_test")
        .length,
    }),
    [questions],
  );

  function openCreate() {
    clearMessages();

    setEditingQuestion(null);

    setForm({
      ...emptyForm,
    });

    setFormOpen(true);
  }

  function openEdit(question) {
    clearMessages();

    setEditingQuestion(question);

    setForm({
      question_type: question.question_type,

      adventure_id: question.adventure_id ?? "",

      age_group: question.age_group,

      story_text_ar: question.story_text_ar || "",

      story_text_en: question.story_text_en || "",

      question_ar: question.question_ar || "",

      question_en: question.question_en || "",

      option_a_ar: question.option_a_ar || "",

      option_a_en: question.option_a_en || "",

      option_b_ar: question.option_b_ar || "",

      option_b_en: question.option_b_en || "",

      option_c_ar: question.option_c_ar || "",

      option_c_en: question.option_c_en || "",

      correct_answer: question.correct_answer || "A",

      feedback_correct_ar: question.feedback_correct_ar || "",

      feedback_correct_en: question.feedback_correct_en || "",

      feedback_wrong_ar: question.feedback_wrong_ar || "",

      feedback_wrong_en: question.feedback_wrong_en || "",

      points: Number(question.points) || 0,

      display_order: Number(question.display_order) || 1,
    });

    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingQuestion(null);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (name === "question_type" && value !== "adventure") {
        updated.adventure_id = "";
      }

      return updated;
    });

    setError("");
  }

  function validateForm() {
    if (form.question_type === "adventure" && !form.adventure_id) {
      return "Adventure questions must be connected to an adventure.";
    }

    if (!form.question_ar.trim()) {
      return "Arabic question is required.";
    }

    if (
      !form.option_a_ar.trim() ||
      !form.option_b_ar.trim() ||
      !form.option_c_ar.trim()
    ) {
      return "Arabic options A, B and C are required.";
    }

    if (!["A", "B", "C"].includes(form.correct_answer)) {
      return "Correct answer must be A, B or C.";
    }

    if (Number(form.points) < 0) {
      return "Points cannot be negative.";
    }

    if (Number(form.display_order) < 1) {
      return "Display order must be at least 1.";
    }

    const duplicate = questions.find((question) => {
      if (editingQuestion && question.id === editingQuestion.id) {
        return false;
      }

      const sameType = question.question_type === form.question_type;

      const sameAge = question.age_group === form.age_group;

      const sameOrder =
        Number(question.display_order) === Number(form.display_order);

      if (!sameType || !sameAge || !sameOrder) {
        return false;
      }

      if (form.question_type === "adventure") {
        return Number(question.adventure_id) === Number(form.adventure_id);
      }

      return true;
    });

    if (duplicate) {
      return "This display order is already used for the same question type and age group.";
    }

    return "";
  }

  async function saveQuestion(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);

      return;
    }

    const payload = {
      question_type: form.question_type,

      age_group: form.age_group,

      story_text_ar: form.story_text_ar.trim(),

      story_text_en: form.story_text_en.trim(),

      question_ar: form.question_ar.trim(),

      question_en: form.question_en.trim(),

      option_a_ar: form.option_a_ar.trim(),

      option_a_en: form.option_a_en.trim(),

      option_b_ar: form.option_b_ar.trim(),

      option_b_en: form.option_b_en.trim(),

      option_c_ar: form.option_c_ar.trim(),

      option_c_en: form.option_c_en.trim(),

      correct_answer: form.correct_answer,

      feedback_correct_ar: form.feedback_correct_ar.trim(),

      feedback_correct_en: form.feedback_correct_en.trim(),

      feedback_wrong_ar: form.feedback_wrong_ar.trim(),

      feedback_wrong_en: form.feedback_wrong_en.trim(),

      points: Number(form.points),

      display_order: Number(form.display_order),

      ...(form.question_type === "adventure"
        ? {
            adventure_id: Number(form.adventure_id),
          }
        : {}),
    };

    try {
      setSaving(true);
      clearMessages();

      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion.id}`, payload);

        setSuccess("Question updated successfully.");
      } else {
        await api.post("/admin/questions", payload);

        setSuccess("Question created successfully.");
      }

      setFormOpen(false);
      setEditingQuestion(null);

      await loadData();
    } catch (err) {
      console.error("Save question error:", err);

      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Could not save question.");
    } finally {
      setSaving(false);
    }
  }

  async function moveToTrash(question) {
    if (!window.confirm("Move this question to trash?")) {
      return;
    }

    try {
      setWorkingId(question.id);

      clearMessages();

      await api.delete(`/admin/questions/${question.id}`);

      setSuccess("Question moved to trash.");

      await loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(
        err.response?.data?.message || "Could not move question to trash.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function restoreQuestion(question) {
    try {
      setWorkingId(question.id);

      clearMessages();

      await api.patch(`/admin/trash/questions/${question.id}/restore`);

      setSuccess("Question restored successfully.");

      await loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Could not restore question.");
    } finally {
      setWorkingId(null);
    }
  }

  async function permanentDelete(question) {
    const confirmation = window.prompt(
      "Permanent deletion cannot be undone.\n\nType DELETE to continue.",
    );

    if (confirmation !== "DELETE") {
      return;
    }

    try {
      setWorkingId(question.id);

      clearMessages();

      await api.delete(`/admin/trash/questions/${question.id}/permanent`);

      setSuccess("Question permanently deleted.");

      await loadData();
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (err.response?.status === 409) {
        setError(
          err.response?.data?.message ||
            "This question has student attempts and cannot be permanently deleted.",
        );

        return;
      }

      setError(
        err.response?.data?.message || "Could not permanently delete question.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function openImagePicker(question) {
    setImageTarget(question);

    setImageModalOpen(true);

    setLoadingMedia(true);

    clearMessages();

    try {
      const response = await api.get("/admin/media");

      setMedia(extractArray(response.data, ["media", "items"]));
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.response?.data?.message || "Could not load media.");
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

      await api.patch(`/admin/questions/${imageTarget.id}/image`, {
        media_id: Number(mediaId),
      });

      setSuccess("Question image updated successfully.");

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
      <main className="question-admin-page">
        <div className="question-admin-loading">
          <div className="question-admin-spinner" />

          <h2>Loading questions...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="question-admin-page">
      <AdminNav />

      <div className="question-admin-container">
        <section className="question-admin-hero">
          <div>
            <span>EDUCATIONAL CONTENT</span>

            <h1>Question Management</h1>

            <p>
              Manage adventure questions and pre/post digital safety
              assessments.
            </p>
          </div>

          <button type="button" onClick={openCreate}>
            + Create Question
          </button>
        </section>

        <section className="question-admin-stats">
          <article>
            <span>❓</span>

            <strong>{counts.total}</strong>

            <p>Total Questions</p>
          </article>

          <article>
            <span>🧭</span>

            <strong>{counts.adventure}</strong>

            <p>Adventure</p>
          </article>

          <article>
            <span>🧠</span>

            <strong>{counts.pre}</strong>

            <p>Pre-Test</p>
          </article>

          <article>
            <span>🎯</span>

            <strong>{counts.post}</strong>

            <p>Post-Test</p>
          </article>

          <article>
            <span>🗑️</span>

            <strong>{trash.length}</strong>

            <p>Trash</p>
          </article>
        </section>

        <section className="question-admin-toolbar">
          <div className="question-type-tabs">
            <button
              type="button"
              className={currentView === "all" ? "selected" : ""}
              onClick={() => setCurrentView("all")}
            >
              All
            </button>

            <button
              type="button"
              className={currentView === "adventure" ? "selected" : ""}
              onClick={() => setCurrentView("adventure")}
            >
              🧭 Adventures
            </button>

            <button
              type="button"
              className={currentView === "pre_test" ? "selected" : ""}
              onClick={() => setCurrentView("pre_test")}
            >
              🧠 Pre-Test
            </button>

            <button
              type="button"
              className={currentView === "post_test" ? "selected" : ""}
              onClick={() => setCurrentView("post_test")}
            >
              🎯 Post-Test
            </button>

            <button
              type="button"
              className={currentView === "trash" ? "selected trash-tab" : ""}
              onClick={() => setCurrentView("trash")}
            >
              🗑️ Trash
            </button>
          </div>

          <div className="question-filters">
            <input
              type="search"
              placeholder="Search questions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={ageFilter}
              onChange={(event) => setAgeFilter(event.target.value)}
            >
              <option value="all">All Ages</option>

              <option value="8-10">Age 8–10</option>

              <option value="11-14">Age 11–14</option>
            </select>

            <select
              value={adventureFilter}
              onChange={(event) => setAdventureFilter(event.target.value)}
            >
              <option value="all">All Adventures</option>

              {adventures.map((adventure) => (
                <option key={adventure.id} value={adventure.id}>
                  {adventure.title_en}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && (
          <div className="question-admin-message error" role="alert">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="question-admin-message success" role="status">
            ✅ {success}
          </div>
        )}

        <section className="question-list">
          {displayedQuestions.length === 0 ? (
            <div className="question-empty">
              <span>❓</span>

              <h2>No questions found</h2>
            </div>
          ) : (
            displayedQuestions.map((question) => {
              const type =
                typeInfo[question.question_type] || typeInfo.adventure;

              const imageUrl = question.image_url
                ? getMediaUrl(question.image_url)
                : question.image_media_id
                  ? getMediaUrl(`/api/media/${question.image_media_id}`)
                  : null;

              return (
                <article key={question.id} className="question-admin-card">
                  {imageUrl && (
                    <div className="question-card-image">
                      <img src={imageUrl} alt="" onError={markQuestionImageUnavailable} />
                    </div>
                  )}

                  <div className="question-card-content">
                    <div className="question-card-top">
                      <div className="question-type-label">
                        <span>{type.icon}</span>

                        <strong>{type.label}</strong>
                      </div>

                      <div className="question-badges">
                        <span>{question.age_group}</span>

                        <span>#{question.display_order}</span>

                        <span>⭐ {Number(question.points) || 0}</span>
                      </div>
                    </div>

                    {question.question_type === "adventure" && (
                      <div className="question-adventure-name">
                        🧭{" "}
                        {question.adventure_title_en ||
                          adventures.find(
                            (item) =>
                              Number(item.id) === Number(question.adventure_id),
                          )?.title_en ||
                          `Adventure #${question.adventure_id}`}
                      </div>
                    )}

                    <h2>{question.question_en || "No English question"}</h2>

                    <h3 dir="rtl">{question.question_ar}</h3>

                    {currentView !== "trash" && (
                      <>
                        <div className="question-options-preview">
                          <span
                            className={
                              question.correct_answer === "A" ? "correct" : ""
                            }
                          >
                            <strong>A</strong>

                            {question.option_a_en || question.option_a_ar}
                          </span>

                          <span
                            className={
                              question.correct_answer === "B" ? "correct" : ""
                            }
                          >
                            <strong>B</strong>

                            {question.option_b_en || question.option_b_ar}
                          </span>

                          <span
                            className={
                              question.correct_answer === "C" ? "correct" : ""
                            }
                          >
                            <strong>C</strong>

                            {question.option_c_en || question.option_c_ar}
                          </span>
                        </div>

                        <div className="admin-correct-answer">
                          ✅ Correct Answer:{" "}
                          <strong>{question.correct_answer}</strong>
                        </div>
                      </>
                    )}

                    {currentView === "trash" ? (
                      <div className="question-card-actions">
                        <button
                          type="button"
                          className="restore"
                          disabled={workingId === question.id}
                          onClick={() => restoreQuestion(question)}
                        >
                          ↩ Restore
                        </button>

                        <button
                          type="button"
                          className="permanent"
                          disabled={workingId === question.id}
                          onClick={() => permanentDelete(question)}
                        >
                          ⛔ Delete Forever
                        </button>
                      </div>
                    ) : (
                      <div className="question-card-actions">
                        <button
                          type="button"
                          className="edit"
                          onClick={() => openEdit(question)}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          className="image"
                          onClick={() => openImagePicker(question)}
                        >
                          🖼️ Image
                        </button>

                        <button
                          type="button"
                          className="trash"
                          disabled={workingId === question.id}
                          onClick={() => moveToTrash(question)}
                        >
                          🗑️ Trash
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {formOpen && (
        <div className="question-modal-backdrop">
          <section className="question-form-modal">
            <header>
              <div>
                <span>
                  {editingQuestion ? "EDIT QUESTION" : "NEW QUESTION"}
                </span>

                <h2>{editingQuestion ? "Edit Question" : "Create Question"}</h2>
              </div>

              <button type="button" onClick={closeForm}>
                ×
              </button>
            </header>

            <form onSubmit={saveQuestion}>
              <section className="question-form-section">
                <h3>1. Question Setup</h3>

                <div className="question-form-grid">
                  <label>
                    Question Type *
                    <select
                      name="question_type"
                      value={form.question_type}
                      onChange={handleFormChange}
                      disabled={Boolean(editingQuestion)}
                    >
                      <option value="adventure">Adventure Question</option>

                      <option value="pre_test">Pre-Test</option>

                      <option value="post_test">Post-Test</option>
                    </select>
                    {editingQuestion && (
                      <small>Question type is locked while editing.</small>
                    )}
                  </label>

                  <label>
                    Age Group *
                    <select
                      name="age_group"
                      value={form.age_group}
                      onChange={handleFormChange}
                    >
                      <option value="8-10">8–10</option>

                      <option value="11-14">11–14</option>
                    </select>
                  </label>

                  {form.question_type === "adventure" && (
                    <label className="full">
                      Adventure *
                      <select
                        name="adventure_id"
                        value={form.adventure_id}
                        onChange={handleFormChange}
                      >
                        <option value="">Select Adventure</option>

                        {adventures.map((adventure) => (
                          <option key={adventure.id} value={adventure.id}>
                            {adventure.title_en}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label>
                    Points
                    <input
                      type="number"
                      name="points"
                      min="0"
                      value={form.points}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Display Order *
                    <input
                      type="number"
                      name="display_order"
                      min="1"
                      value={form.display_order}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>
              </section>

              <section className="question-form-section">
                <h3>2. Story / Scenario</h3>

                <div className="question-form-grid">
                  <label>
                    English Story
                    <textarea
                      name="story_text_en"
                      rows={3}
                      value={form.story_text_en}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Arabic Story
                    <textarea
                      name="story_text_ar"
                      rows={3}
                      dir="rtl"
                      value={form.story_text_ar}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>
              </section>

              <section className="question-form-section">
                <h3>3. Question</h3>

                <div className="question-form-grid">
                  <label>
                    English Question
                    <textarea
                      name="question_en"
                      rows={3}
                      value={form.question_en}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Arabic Question *
                    <textarea
                      name="question_ar"
                      rows={3}
                      dir="rtl"
                      value={form.question_ar}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>
              </section>

              <section className="question-form-section">
                <h3>4. Answer Options</h3>

                <div className="answer-option-editor">
                  {["a", "b", "c"].map((letter) => {
                    const upper = letter.toUpperCase();

                    return (
                      <div
                        key={letter}
                        className={`answer-editor-row ${
                          form.correct_answer === upper ? "correct" : ""
                        }`}
                      >
                        <label className="correct-radio">
                          <input
                            type="radio"
                            name="correct_answer"
                            value={upper}
                            checked={form.correct_answer === upper}
                            onChange={handleFormChange}
                          />

                          <strong>{upper}</strong>
                        </label>

                        <input
                          name={`option_${letter}_en`}
                          placeholder={`Option ${upper} - English`}
                          value={form[`option_${letter}_en`]}
                          onChange={handleFormChange}
                        />

                        <input
                          name={`option_${letter}_ar`}
                          placeholder={`Option ${upper} - Arabic *`}
                          dir="rtl"
                          value={form[`option_${letter}_ar`]}
                          onChange={handleFormChange}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="correct-answer-note">
                  ✅ Selected correct answer:{" "}
                  <strong>{form.correct_answer}</strong>
                </div>
              </section>

              <section className="question-form-section">
                <h3>5. Feedback</h3>

                <div className="question-form-grid">
                  <label>
                    Correct Feedback - English
                    <textarea
                      name="feedback_correct_en"
                      rows={2}
                      value={form.feedback_correct_en}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Correct Feedback - Arabic
                    <textarea
                      name="feedback_correct_ar"
                      rows={2}
                      dir="rtl"
                      value={form.feedback_correct_ar}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Wrong Feedback - English
                    <textarea
                      name="feedback_wrong_en"
                      rows={2}
                      value={form.feedback_wrong_en}
                      onChange={handleFormChange}
                    />
                  </label>

                  <label>
                    Wrong Feedback - Arabic
                    <textarea
                      name="feedback_wrong_ar"
                      rows={2}
                      dir="rtl"
                      value={form.feedback_wrong_ar}
                      onChange={handleFormChange}
                    />
                  </label>
                </div>
              </section>

              {error && (
                <div className="question-admin-message error">⚠️ {error}</div>
              )}

              <footer>
                <button type="button" className="cancel" onClick={closeForm}>
                  Cancel
                </button>

                <button type="submit" className="save" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingQuestion
                      ? "Save Changes"
                      : "Create Question"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {imageModalOpen && (
        <div className="question-modal-backdrop">
          <section className="question-media-modal">
            <header>
              <div>
                <span>MEDIA LIBRARY</span>

                <h2>Choose Question Image</h2>
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
              <div className="question-media-state">Loading media...</div>
            ) : media.length === 0 ? (
              <div className="question-media-state">
                <span>🖼️</span>

                <p>No media uploaded.</p>

                <Link to="/admin/media">Open Media Manager</Link>
              </div>
            ) : (
              <div className="question-media-grid">
                {media.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    disabled={assigningMediaId !== null}
                    onClick={() => assignImage(item.id)}
                  >
                    <img
                      src={getMediaUrl(`/api/media/${item.id}`)}
                      alt={item.original_name || "Media"}
                    />

                    <strong>{item.original_name || `Media #${item.id}`}</strong>

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

export default QuestionManagement;
