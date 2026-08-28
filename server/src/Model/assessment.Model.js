import pool from "../config/db.js";

export const getAssessmentQuestions = async (testType, ageGroup) => {
  const result = await pool.query(
    `
    SELECT
      id,
      question_type,
      age_group,
      question_ar,
      question_en,
      option_a_ar,
      option_a_en,
      option_b_ar,
      option_b_en,
      option_c_ar,
      option_c_en,
      display_order
    FROM questions
    WHERE question_type = $1
      AND age_group = $2
    ORDER BY display_order ASC;
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
