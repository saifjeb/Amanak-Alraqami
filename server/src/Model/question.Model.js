import pool from "../config/db.js";

export const getQuestionsByAdventure = async (
  adventureId,
  ageGroup,
) => {
  const result = await pool.query(
    `
    SELECT
      q.id,
      q.adventure_id,
      q.question_type,
      q.age_group,
      q.story_text_ar,
      q.story_text_en,
      q.question_ar,
      q.question_en,
      q.option_a_ar,
      q.option_a_en,
      q.option_b_ar,
      q.option_b_en,
      q.option_c_ar,
      q.option_c_en,
      q.points,
      q.display_order,

      CASE
        WHEN m.id IS NOT NULL
          AND m.deleted_at IS NULL
        THEN m.id
        ELSE NULL
      END AS image_media_id,

      CASE
        WHEN m.id IS NOT NULL
          AND m.deleted_at IS NULL
        THEN '/api/media/' || m.id
        ELSE NULL
      END AS image_url

    FROM questions q

    LEFT JOIN media m
      ON m.id = q.image_media_id

    WHERE q.adventure_id = $1
      AND q.age_group = $2
      AND q.question_type = 'adventure'
      AND q.deleted_at IS NULL

    ORDER BY q.display_order ASC;
    `,
    [adventureId, ageGroup],
  );

  return result.rows;
};

export const getQuestionById = async (
  id,
  ageGroup,
) => {
  const result = await pool.query(
    `
    SELECT
      q.id,
      q.adventure_id,
      q.question_type,
      q.age_group,
      q.story_text_ar,
      q.story_text_en,
      q.question_ar,
      q.question_en,
      q.option_a_ar,
      q.option_a_en,
      q.option_b_ar,
      q.option_b_en,
      q.option_c_ar,
      q.option_c_en,
      q.points,
      q.display_order,

      CASE
        WHEN m.id IS NOT NULL
          AND m.deleted_at IS NULL
        THEN m.id
        ELSE NULL
      END AS image_media_id,

      CASE
        WHEN m.id IS NOT NULL
          AND m.deleted_at IS NULL
        THEN '/api/media/' || m.id
        ELSE NULL
      END AS image_url

    FROM questions q

    LEFT JOIN media m
      ON m.id = q.image_media_id

    WHERE q.id = $1
      AND q.age_group = $2
      AND q.question_type = 'adventure'
      AND q.deleted_at IS NULL

    LIMIT 1;
    `,
    [id, ageGroup],
  );

  return result.rows[0] || null;
};

export const getQuestionForAnswer = async (id, ageGroup) => {
  const result = await pool.query(
    `SELECT id,adventure_id,question_type,age_group,correct_answer,feedback_correct_ar,feedback_correct_en,feedback_wrong_ar,feedback_wrong_en,points
    FROM questions
    WHERE id = $1 AND age_group = $2 AND question_type = 'adventure' AND deleted_at IS NULL LIMIT 1;
    `,[id, ageGroup],);
  return result.rows[0] || null;
};

export const getAllQuestionsAdmin = async () => {
  const result = await pool.query(`
    SELECT
      q.id,
      q.adventure_id,
      a.title_en AS adventure_title_en,
      q.question_type,
      q.age_group,
      q.story_text_ar,
      q.story_text_en,
      q.question_ar,
      q.question_en,
      q.option_a_ar,
      q.option_a_en,
      q.option_b_ar,
      q.option_b_en,
      q.option_c_ar,
      q.option_c_en,
      q.correct_answer,
      q.feedback_correct_ar,
      q.feedback_correct_en,
      q.feedback_wrong_ar,
      q.feedback_wrong_en,
      q.points,
      q.display_order,
      q.created_at,
      q.deleted_at,
      q.image_media_id,

      CASE
        WHEN m.id IS NOT NULL
          AND m.deleted_at IS NULL
        THEN '/api/media/' || m.id
        ELSE NULL
      END AS image_url

    FROM questions q

    LEFT JOIN adventures a
      ON a.id = q.adventure_id

    LEFT JOIN media m
      ON m.id = q.image_media_id

    WHERE q.deleted_at IS NULL

    ORDER BY
      q.question_type,
      q.age_group,
      q.adventure_id NULLS FIRST,
      q.display_order;
  `);

  return result.rows;
};

export const createQuestion = async ({
  adventureId,questionType,ageGroup,storyTextAr,storyTextEn,questionAr,questionEn,optionAAr,optionAEn,
  optionBAr,optionBEn,optionCAr,optionCEn,correctAnswer,feedbackCorrectAr,feedbackCorrectEn,feedbackWrongAr,feedbackWrongEn,points,displayOrder,}) => {
  const result = await pool.query(
    `INSERT INTO questions (adventure_id,question_type,age_group,story_text_ar,story_text_en,question_ar,question_en,option_a_ar,option_a_en,option_b_ar,
    option_b_en,option_c_ar,option_c_en,correct_answer,feedback_correct_ar,feedback_correct_en,feedback_wrong_ar,feedback_wrong_en,points,display_order)
    VALUES ($1, $2, $3, $4, $5,$6, $7, $8, $9, $10,$11, $12, $13, $14, $15,$16, $17, $18, $19, $20)
    RETURNING *;
    `,
    [
      adventureId,
      questionType,
      ageGroup,
      storyTextAr || null,
      storyTextEn || null,
      questionAr,
      questionEn || null,
      optionAAr,
      optionAEn || null,
      optionBAr,
      optionBEn || null,
      optionCAr,
      optionCEn || null,
      correctAnswer,
      feedbackCorrectAr || null,
      feedbackCorrectEn || null,
      feedbackWrongAr || null,
      feedbackWrongEn || null,
      points,
      displayOrder,
    ],
  );

  return result.rows[0];
};
export const updateQuestion = async (
  id,
  {
    adventureId,
    questionType,
    ageGroup,
    storyTextAr,
    storyTextEn,
    questionAr,
    questionEn,
    optionAAr,
    optionAEn,
    optionBAr,
    optionBEn,
    optionCAr,
    optionCEn,
    correctAnswer,
    feedbackCorrectAr,
    feedbackCorrectEn,
    feedbackWrongAr,
    feedbackWrongEn,
    points,
    displayOrder,
  },
) => {
  const result = await pool.query(
    `
    UPDATE questions
    SET
      adventure_id = COALESCE($1, adventure_id),
      question_type = COALESCE($2, question_type),
      age_group = COALESCE($3, age_group),
      story_text_ar = COALESCE($4, story_text_ar),
      story_text_en = COALESCE($5, story_text_en),
      question_ar = COALESCE($6, question_ar),
      question_en = COALESCE($7, question_en),
      option_a_ar = COALESCE($8, option_a_ar),
      option_a_en = COALESCE($9, option_a_en),
      option_b_ar = COALESCE($10, option_b_ar),
      option_b_en = COALESCE($11, option_b_en),
      option_c_ar = COALESCE($12, option_c_ar),
      option_c_en = COALESCE($13, option_c_en),
      correct_answer = COALESCE($14, correct_answer),
      feedback_correct_ar = COALESCE($15, feedback_correct_ar),
      feedback_correct_en = COALESCE($16, feedback_correct_en),
      feedback_wrong_ar = COALESCE($17, feedback_wrong_ar),
      feedback_wrong_en = COALESCE($18, feedback_wrong_en),
      points = COALESCE($19, points),
      display_order = COALESCE($20, display_order)
    WHERE id = $21
      AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      adventureId ?? null,
      questionType ?? null,
      ageGroup ?? null,
      storyTextAr ?? null,
      storyTextEn ?? null,
      questionAr ?? null,
      questionEn ?? null,
      optionAAr ?? null,
      optionAEn ?? null,
      optionBAr ?? null,
      optionBEn ?? null,
      optionCAr ?? null,
      optionCEn ?? null,
      correctAnswer ?? null,
      feedbackCorrectAr ?? null,
      feedbackCorrectEn ?? null,
      feedbackWrongAr ?? null,
      feedbackWrongEn ?? null,
      points ?? null,
      displayOrder ?? null,
      id,
    ],
  );

  return result.rows[0] || null;
};
export const moveQuestionToTrash = async (id) => {
  const result = await pool.query(
    `
    UPDATE questions
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING *;
    `,
    [id],
  );

  return result.rows[0] || null;
};
export const getTrashedQuestions = async () => {
  const result = await pool.query(
    `
    SELECT
      id,
      adventure_id,
      question_type,
      age_group,
      question_ar,
      question_en,
      correct_answer,
      points,
      display_order,
      created_at,
      deleted_at
    FROM questions
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC;
    `,
  );

  return result.rows;
};
export const restoreQuestion = async (id) => {
  const result = await pool.query(
    `
    UPDATE questions
    SET deleted_at = NULL
    WHERE id = $1
      AND deleted_at IS NOT NULL
    RETURNING *;
    `,
    [id],
  );

  return result.rows[0] || null;
};
export const questionHasAttempts = async (id) => {
  const result = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM question_attempts
      WHERE question_id = $1
    ) AS has_attempts;
    `,
    [id],
  );

  return result.rows[0].has_attempts;
};

export const permanentlyDeleteQuestion = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM questions
    WHERE id = $1
      AND deleted_at IS NOT NULL
    RETURNING
      id,
      question_ar,
      question_en;
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const setQuestionImage = async (questionId,mediaId,) => {
  const result = await pool.query(
    `UPDATE questions SET image_media_id = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING id,adventure_id,question_type,age_group,question_ar,question_en,image_media_id;`,
    [mediaId, questionId],);
  return result.rows[0] || null;
};