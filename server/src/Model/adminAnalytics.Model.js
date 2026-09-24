import pool from "../config/db.js";

export const getAdminAnalytics = async () => {
  const [
    overviewResult,
    studentResult,
    ageResult,
    learningResult,
    adventureResult,
    questionResult,
    mediaResult,
    assessmentResult,
  ] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)::integer AS total_children,
        (SELECT COUNT(*) FROM parents)::integer AS total_parents,
        (
          SELECT COUNT(*)
          FROM adventures
          WHERE deleted_at IS NULL
        )::integer AS total_adventures,
        (
          SELECT COUNT(*)
          FROM questions
          WHERE deleted_at IS NULL
        )::integer AS total_questions,
        (
          SELECT COUNT(*)
          FROM media
          WHERE deleted_at IS NULL
        )::integer AS total_media,
        (
          SELECT COUNT(*)
          FROM progress
          WHERE completed = TRUE
        )::integer AS completed_adventures,
        (
          SELECT COUNT(*)
          FROM user_badges
        )::integer AS total_badges_awarded;
    `),

    pool.query(`
      SELECT
        COUNT(*)::integer AS total,
        COUNT(*) FILTER (WHERE is_enabled = TRUE)::integer AS enabled,
        COUNT(*) FILTER (WHERE is_enabled = FALSE)::integer AS disabled
      FROM users;
    `),

    pool.query(`
      SELECT
        age_group,
        COUNT(*)::integer AS total
      FROM users
      GROUP BY age_group
      ORDER BY age_group;
    `),

    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE completed_count >= total_adventures
          AND total_adventures > 0
        )::integer AS completed,

        COUNT(*) FILTER (
          WHERE completed_count > 0
          AND completed_count < total_adventures
        )::integer AS in_progress,

        COUNT(*) FILTER (
          WHERE completed_count = 0
        )::integer AS not_started
      FROM (
        SELECT
          u.id,
          COUNT(p.id) FILTER (WHERE p.completed = TRUE) AS completed_count,
          (
            SELECT COUNT(*)
            FROM adventures
            WHERE is_active = TRUE
              AND deleted_at IS NULL
          ) AS total_adventures
        FROM users u
        LEFT JOIN progress p
          ON p.user_id = u.id
        GROUP BY u.id
      ) learning;
    `),

    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE deleted_at IS NULL
          AND is_active = TRUE
        )::integer AS active,

        COUNT(*) FILTER (
          WHERE deleted_at IS NULL
          AND is_active = FALSE
        )::integer AS inactive,

        COUNT(*) FILTER (
          WHERE deleted_at IS NOT NULL
        )::integer AS trash
      FROM adventures;
    `),

    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE deleted_at IS NULL
          AND question_type = 'adventure'
        )::integer AS adventure,

        COUNT(*) FILTER (
          WHERE deleted_at IS NULL
          AND question_type = 'pre_test'
        )::integer AS pre_test,

        COUNT(*) FILTER (
          WHERE deleted_at IS NULL
          AND question_type = 'post_test'
        )::integer AS post_test,

        COUNT(*) FILTER (
          WHERE deleted_at IS NOT NULL
        )::integer AS trash
      FROM questions;
    `),

    pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE deleted_at IS NULL
        )::integer AS active,

        COUNT(*) FILTER (
          WHERE deleted_at IS NOT NULL
        )::integer AS trash,

        COALESCE(
          SUM(file_size) FILTER (
            WHERE deleted_at IS NULL
          ),
          0
        )::bigint AS storage_bytes
      FROM media;
    `),

    pool.query(`
      SELECT
        COALESCE(
          ROUND(AVG(pre_test_score), 2),
          0
        ) AS average_pre_test,

        COALESCE(
          ROUND(AVG(post_test_score), 2),
          0
        ) AS average_post_test,

        COALESCE(
          ROUND(AVG(improvement), 2),
          0
        ) AS average_improvement
      FROM user_assessment_results;
    `),
  ]);

  return {
    overview: overviewResult.rows[0],
    students: studentResult.rows[0],
    age_groups: ageResult.rows,
    learning_status: learningResult.rows[0],
    adventures: adventureResult.rows[0],
    questions: questionResult.rows[0],
    media: mediaResult.rows[0],
    assessments: assessmentResult.rows[0],
  };
};
