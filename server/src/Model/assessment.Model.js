import pool from "../config/db.js";

export const getAssessmentQuestions = async (
  testType,
  ageGroup,
) => {
  const result = await pool.query(
    `
    SELECT
      q.id,
      q.question_type,
      q.age_group,
      q.question_ar,
      q.question_en,
      q.option_a_ar,
      q.option_a_en,
      q.option_b_ar,
      q.option_b_en,
      q.option_c_ar,
      q.option_c_en,
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

    WHERE q.question_type = $1
      AND q.age_group = $2
      AND q.deleted_at IS NULL

    ORDER BY q.display_order ASC;
    `,
    [testType, ageGroup],
  );

  return result.rows;
};

export const getAssessmentQuestionsForScoring = async (testType, ageGroup) => {
  const result = await pool.query(
    `
    SELECT
      id,
      correct_answer
    FROM questions
    WHERE question_type = $1
      AND age_group = $2
      AND deleted_at IS NULL
    ORDER BY display_order ASC;
    `,
    [testType, ageGroup],
  );

  return result.rows;
};

export const getExistingAssessmentAttempt = async (userId, testType) => {
  const result = await pool.query(
    `
    SELECT
      id,
      user_id,
      test_type,
      correct_answers,
      total_questions,
      score_percentage,
      completed_at
    FROM attempts
    WHERE user_id = $1
      AND test_type = $2
    ORDER BY completed_at DESC
    LIMIT 1;
    `,
    [userId, testType],
  );

  return result.rows[0] || null;
};
export const createAssessmentAttempt = async ({
  userId,
  testType,
  correctAnswers,
  totalQuestions,
  scorePercentage,
}) => {
  const result = await pool.query(
    `
    INSERT INTO attempts (
      user_id,
      test_type,
      correct_answers,
      total_questions,
      score_percentage
    )
    VALUES ($1, $2, $3, $4, $5)

    RETURNING
      id,
      user_id,
      test_type,
      correct_answers,
      total_questions,
      score_percentage,
      completed_at;
    `,
    [userId, testType, correctAnswers, totalQuestions, scorePercentage],
  );

  return result.rows[0];
};

export const getUserAssessmentResults = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      user_id,
      nickname,
      age_group,
      pre_test_score,
      post_test_score,
      improvement
    FROM user_assessment_results
    WHERE user_id = $1
    LIMIT 1;
    `,
    [userId],
  );

  return result.rows[0] || null;
};
