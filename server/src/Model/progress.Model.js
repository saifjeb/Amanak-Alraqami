import pool from "../config/db.js";

export const syncAdventureProgress = async (
  userId,
  adventureId,
  ageGroup
) => {
  const result = await pool.query(
    `
    WITH stats AS (
      SELECT
        COUNT(DISTINCT q.id)::integer AS total_questions,

        COUNT(DISTINCT qa.question_id)
          FILTER (WHERE qa.is_correct = TRUE)::integer
          AS correct_questions,

        COALESCE(
          SUM(qa.points_awarded),
          0
        )::integer AS earned_points

      FROM questions q

      LEFT JOIN question_attempts qa
        ON qa.question_id = q.id
        AND qa.user_id = $1

      WHERE q.adventure_id = $2
        AND q.age_group = $3
        AND q.question_type = 'adventure'
    )

    INSERT INTO progress (
      user_id,
      adventure_id,
      score,
      earned_points,
      completed,
      started_at,
      completed_at
    )

    SELECT
      $1,
      $2,

      CASE
        WHEN total_questions = 0 THEN 0
        ELSE ROUND(
          (correct_questions::numeric / total_questions) * 100
        )::integer
      END,

      earned_points,

      (
        total_questions > 0
        AND correct_questions = total_questions
      ),

      CURRENT_TIMESTAMP,

      CASE
        WHEN total_questions > 0
          AND correct_questions = total_questions
        THEN CURRENT_TIMESTAMP
        ELSE NULL
      END

    FROM stats

    ON CONFLICT (user_id, adventure_id)

    DO UPDATE SET
      score = EXCLUDED.score,
      earned_points = EXCLUDED.earned_points,
      completed = EXCLUDED.completed,

      completed_at = CASE
        WHEN EXCLUDED.completed = TRUE
        THEN COALESCE(
          progress.completed_at,
          CURRENT_TIMESTAMP
        )
        ELSE progress.completed_at
      END

    RETURNING
      id,
      user_id,
      adventure_id,
      score,
      earned_points,
      completed,
      started_at,
      completed_at;
    `,
    [userId, adventureId, ageGroup]
  );

  return result.rows[0];
};


export const getUserProgress = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      p.id,
      p.adventure_id,
      a.title_ar,
      a.title_en,
      p.score,
      p.earned_points,
      p.completed,
      p.started_at,
      p.completed_at

    FROM progress p

    JOIN adventures a
      ON a.id = p.adventure_id

    WHERE p.user_id = $1

    ORDER BY a.display_order ASC;
    `,
    [userId]
  );

  return result.rows;
};