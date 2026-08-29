import pool from "../config/db.js";

export const getAdminStudentStatuses = async () => {
  const result = await pool.query(`
    WITH active_adventures AS (
      SELECT COUNT(*)::integer AS total_adventures
      FROM adventures
      WHERE is_active = TRUE
        AND deleted_at IS NULL
    ),

    completed_adventures AS (
      SELECT
        p.user_id,
        COUNT(DISTINCT p.adventure_id)::integer AS completed_adventures
      FROM progress p
      INNER JOIN adventures a
        ON a.id = p.adventure_id
      WHERE p.completed = TRUE
        AND a.is_active = TRUE
        AND a.deleted_at IS NULL
      GROUP BY p.user_id
    ),

    badge_counts AS (
      SELECT
        user_id,
        COUNT(*)::integer AS badges_count
      FROM user_badges
      GROUP BY user_id
    ),

    question_activity AS (
      SELECT DISTINCT user_id
      FROM question_attempts
    )

    SELECT
      u.id,
      u.nickname,
      u.age_group,
      u.avatar,
      u.total_points,
      u.current_level,
      u.created_at,

      u.last_login_at,
      u.last_active_at,
      u.is_enabled,

      CASE
        WHEN u.is_enabled = TRUE
          THEN 'enabled'
        ELSE 'disabled'
      END AS account_status,

      CASE
        WHEN u.is_enabled = FALSE THEN FALSE

        WHEN u.last_active_at IS NOT NULL
          AND u.last_active_at >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
          THEN TRUE

        ELSE FALSE
      END AS is_online,

      CASE
        WHEN u.is_enabled = FALSE
          THEN 'disabled'

        WHEN u.last_active_at IS NOT NULL
          AND u.last_active_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
          THEN 'active'

        ELSE 'inactive'
      END AS activity_status,

      aa.total_adventures,

      COALESCE(
        ca.completed_adventures,
        0
      )::integer AS completed_adventures,

      CASE
        WHEN aa.total_adventures = 0 THEN 0

        ELSE ROUND(
          (
            COALESCE(ca.completed_adventures, 0)::numeric
            / aa.total_adventures
          ) * 100,
          2
        )
      END AS completion_percentage,

      COALESCE(
        bc.badges_count,
        0
      )::integer AS badges_count,

      ar.pre_test_score,
      ar.post_test_score,
      ar.improvement,

      CASE
        WHEN ar.pre_test_score IS NOT NULL
          THEN TRUE
        ELSE FALSE
      END AS pre_test_taken,

      CASE
        WHEN ar.post_test_score IS NOT NULL
          THEN TRUE
        ELSE FALSE
      END AS post_test_taken,

      CASE

        WHEN aa.total_adventures > 0
          AND COALESCE(ca.completed_adventures, 0) >= aa.total_adventures
          THEN 'completed'

        WHEN ar.pre_test_score IS NOT NULL
          OR qa.user_id IS NOT NULL
          OR COALESCE(ca.completed_adventures, 0) > 0
          THEN 'in_progress'

        ELSE 'not_started'

      END AS learning_status

    FROM users u

    CROSS JOIN active_adventures aa

    LEFT JOIN completed_adventures ca
      ON ca.user_id = u.id

    LEFT JOIN badge_counts bc
      ON bc.user_id = u.id

    LEFT JOIN user_assessment_results ar
      ON ar.user_id = u.id

    LEFT JOIN question_activity qa
      ON qa.user_id = u.id

    ORDER BY u.id ASC;
  `);

  return result.rows;
};
