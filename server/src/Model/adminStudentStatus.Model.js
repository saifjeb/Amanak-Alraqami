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
        WHEN u.is_enabled = TRUE THEN 'enabled'
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
        WHEN u.is_enabled = FALSE THEN 'disabled'
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
        WHEN ar.pre_test_score IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS pre_test_taken,

      CASE
        WHEN ar.post_test_score IS NOT NULL THEN TRUE
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


export const getAdminStudentDetails = async (studentId) => {
  const result = await pool.query(
    `
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
        WHEN u.is_enabled = TRUE THEN 'enabled'
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
        WHEN u.is_enabled = FALSE THEN 'disabled'

        WHEN u.last_active_at IS NOT NULL
          AND u.last_active_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
          THEN 'active'

        ELSE 'inactive'
      END AS activity_status,

      (
        SELECT COUNT(*)::integer
        FROM adventures a
        WHERE a.is_active = TRUE
          AND a.deleted_at IS NULL
      ) AS total_adventures,

      (
        SELECT COUNT(*)::integer
        FROM progress p
        INNER JOIN adventures a
          ON a.id = p.adventure_id
        WHERE p.user_id = u.id
          AND p.completed = TRUE
          AND a.is_active = TRUE
          AND a.deleted_at IS NULL
      ) AS completed_adventures,

      CASE
        WHEN (
          SELECT COUNT(*)
          FROM adventures a
          WHERE a.is_active = TRUE
            AND a.deleted_at IS NULL
        ) = 0
        THEN 0

        ELSE ROUND(
          (
            (
              SELECT COUNT(*)::numeric
              FROM progress p
              INNER JOIN adventures a
                ON a.id = p.adventure_id
              WHERE p.user_id = u.id
                AND p.completed = TRUE
                AND a.is_active = TRUE
                AND a.deleted_at IS NULL
            )
            /
            (
              SELECT COUNT(*)::numeric
              FROM adventures a
              WHERE a.is_active = TRUE
                AND a.deleted_at IS NULL
            )
          ) * 100,
          2
        )
      END AS completion_percentage,

      (
        SELECT COUNT(*)::integer
        FROM user_badges ub
        WHERE ub.user_id = u.id
      ) AS badges_count,

      ar.pre_test_score,
      ar.post_test_score,
      ar.improvement,

      CASE
        WHEN ar.pre_test_score IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS pre_test_taken,

      CASE
        WHEN ar.post_test_score IS NOT NULL THEN TRUE
        ELSE FALSE
      END AS post_test_taken,

      CASE
        WHEN (
          SELECT COUNT(*)
          FROM adventures a
          WHERE a.is_active = TRUE
            AND a.deleted_at IS NULL
        ) > 0

        AND (
          SELECT COUNT(*)
          FROM progress p
          INNER JOIN adventures a
            ON a.id = p.adventure_id
          WHERE p.user_id = u.id
            AND p.completed = TRUE
            AND a.is_active = TRUE
            AND a.deleted_at IS NULL
        ) >= (
          SELECT COUNT(*)
          FROM adventures a
          WHERE a.is_active = TRUE
            AND a.deleted_at IS NULL
        )

        THEN 'completed'

        WHEN ar.pre_test_score IS NOT NULL
          OR EXISTS (
            SELECT 1
            FROM question_attempts qa
            WHERE qa.user_id = u.id
          )
        THEN 'in_progress'

        ELSE 'not_started'
      END AS learning_status,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'adventure_id', a.id,
              'title_ar', a.title_ar,
              'title_en', a.title_en,
              'score', COALESCE(p.score, 0),
              'earned_points', COALESCE(p.earned_points, 0),
              'completed', COALESCE(p.completed, FALSE),
              'started_at', p.started_at,
              'completed_at', p.completed_at
            )
            ORDER BY a.id
          )

          FROM adventures a

          LEFT JOIN progress p
            ON p.adventure_id = a.id
            AND p.user_id = u.id

          WHERE a.is_active = TRUE
            AND a.deleted_at IS NULL
        ),
        '[]'::json
      ) AS progress,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'badge_id', b.id,
              'name', b.name,
              'title_ar', b.title_ar,
              'title_en', b.title_en,
              'description_ar', b.description_ar,
              'description_en', b.description_en,
              'icon', b.icon,
              'earned_at', ub.earned_at
            )
            ORDER BY ub.earned_at
          )

          FROM user_badges ub

          INNER JOIN badges b
            ON b.id = ub.badge_id

          WHERE ub.user_id = u.id
        ),
        '[]'::json
      ) AS badges

    FROM users u

    LEFT JOIN user_assessment_results ar
      ON ar.user_id = u.id

    WHERE u.id = $1;
    `,
    [studentId],
  );

  return result.rows[0] || null;
};