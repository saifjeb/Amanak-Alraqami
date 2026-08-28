import pool from "../config/db.js";

export const unlockAdventureBadge = async (
  userId,
  adventureId
) => {
  const result = await pool.query(
    `
    INSERT INTO user_badges (
      user_id,
      badge_id,
      earned_at
    )

    SELECT
      $1,
      b.id,
      CURRENT_TIMESTAMP

    FROM adventures a

    JOIN badges b
      ON b.name = a.badge_name

    WHERE a.id = $2

      AND EXISTS (
        SELECT 1
        FROM progress p
        WHERE p.user_id = $1
          AND p.adventure_id = $2
          AND p.completed = TRUE
      )

    ON CONFLICT (user_id, badge_id)
    DO NOTHING

    RETURNING
      id,
      user_id,
      badge_id,
      earned_at;
    `,
    [userId, adventureId]
  );

  return result.rows[0] || null;
};

export const unlockCyberHeroBadge = async (
  userId
) => {
  const result = await pool.query(
    `
    INSERT INTO user_badges (
      user_id,
      badge_id,
      earned_at
    )

    SELECT
      $1,
      b.id,
      CURRENT_TIMESTAMP

    FROM badges b

    WHERE b.name = 'cyber_hero'

      AND (
        SELECT COUNT(*)
        FROM progress p

        JOIN adventures a
          ON a.id = p.adventure_id

        WHERE p.user_id = $1
          AND p.completed = TRUE
          AND a.is_active = TRUE
      ) = (
        SELECT COUNT(*)
        FROM adventures
        WHERE is_active = TRUE
      )

      AND (
        SELECT COUNT(*)
        FROM adventures
        WHERE is_active = TRUE
      ) > 0

    ON CONFLICT (user_id, badge_id)
    DO NOTHING

    RETURNING
      id,
      user_id,
      badge_id,
      earned_at;
    `,
    [userId]
  );

  return result.rows[0] || null;
};


export const getUserBadges = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      ub.id,
      ub.badge_id,
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
    [userId]
  );

  return result.rows;
};