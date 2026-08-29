import pool from "../config/db.js";

export const getAdminDashboardStats = async () => {
  const result = await pool.query(`
    SELECT
      (
        SELECT COUNT(*)
        FROM users
      )::integer AS total_children,

      (
        SELECT COUNT(*)
        FROM parents
      )::integer AS total_parents,

      (
        SELECT COUNT(*)
        FROM adventures
        WHERE is_active = TRUE
        AND deleted_at IS NULL
      )::integer AS total_adventures,

      (
        SELECT COUNT(*)
        FROM progress
        WHERE completed = TRUE
      )::integer AS completed_adventures,

      (
        SELECT COUNT(*)
        FROM user_badges
      )::integer AS total_badges_awarded,

      COALESCE(
        (
          SELECT ROUND(
            AVG(pre_test_score),
            2
          )
          FROM user_assessment_results
          WHERE pre_test_score IS NOT NULL
        ),
        0
      ) AS average_pre_test,

      COALESCE(
        (
          SELECT ROUND(
            AVG(post_test_score),
            2
          )
          FROM user_assessment_results
          WHERE post_test_score IS NOT NULL
        ),
        0
      ) AS average_post_test,

      COALESCE(
        (
          SELECT ROUND(
            AVG(improvement),
            2
          )
          FROM user_assessment_results
          WHERE improvement IS NOT NULL
        ),
        0
      ) AS average_improvement;
  `);
  return result.rows[0];
};