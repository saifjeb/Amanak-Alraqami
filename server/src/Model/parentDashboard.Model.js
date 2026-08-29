import pool from "../config/db.js";

export const getParentChildDashboard = async (parentId, childId) => {
  const childResult = await pool.query(
    `
    SELECT
      u.id,
      u.nickname,
      u.age_group,
      u.avatar,
      u.total_points,
      u.current_level,
      pc.created_at AS linked_at

    FROM parent_children pc

    JOIN users u
      ON u.id = pc.child_id

    WHERE pc.parent_id = $1
      AND pc.child_id = $2

    LIMIT 1;
    `,
    [parentId, childId],
  );

  if (childResult.rows.length === 0) {
    return null;
  }

  const child = childResult.rows[0];

  const progressResult = await pool.query(
    `
    SELECT
      a.id AS adventure_id,
      a.title_ar,
      a.title_en,
      a.icon,
      a.display_order,

      COALESCE(p.score, 0) AS score,
      COALESCE(p.earned_points, 0) AS earned_points,
      COALESCE(p.completed, FALSE) AS completed,

      p.started_at,
      p.completed_at

    FROM adventures a

    LEFT JOIN progress p
      ON p.adventure_id = a.id
      AND p.user_id = $1

    WHERE a.is_active = TRUE

    ORDER BY a.display_order ASC;
    `,
    [childId],
  );
  const badgesResult = await pool.query(
    `
    SELECT
      b.id AS badge_id,
      b.name,
      b.title_ar,
      b.title_en,
      b.description_ar,
      b.description_en,
      b.icon,
      ub.earned_at

    FROM user_badges ub

    JOIN badges b
      ON b.id = ub.badge_id

    WHERE ub.user_id = $1

    ORDER BY ub.earned_at ASC;
    `,
    [childId],
  );

  const assessmentResult = await pool.query(
    `
    SELECT
      pre_test_score,
      post_test_score,
      improvement

    FROM user_assessment_results

    WHERE user_id = $1

    LIMIT 1;
    `,
    [childId],
  );

  const assessment = assessmentResult.rows[0] || {
    pre_test_score: null,
    post_test_score: null,
    improvement: null,
  };

  return {
    child,

    progress: progressResult.rows,

    badges: badgesResult.rows,

    assessment: {
      pre_test_score:
        assessment.pre_test_score !== null
          ? Number(assessment.pre_test_score)
          : null,

      post_test_score:
        assessment.post_test_score !== null
          ? Number(assessment.post_test_score)
          : null,

      improvement:
        assessment.improvement !== null ? Number(assessment.improvement) : null,
    },
  };
};
