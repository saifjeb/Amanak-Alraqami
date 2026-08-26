import pool from "../config/db.js";

export const recordQuestionAttempt = async ({
  userId,
  questionId,
  selectedAnswer,
  isCorrect,
  questionPoints,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ========================================
    // CORRECT ANSWER
    // ========================================
    if (isCorrect) {
      const rewardedAttempt = await client.query(
        `
        INSERT INTO question_attempts (
          user_id,
          question_id,
          selected_answer,
          is_correct,
          points_awarded
        )
        VALUES ($1, $2, $3, TRUE, $4)
        ON CONFLICT DO NOTHING
        RETURNING
          id,
          user_id,
          question_id,
          selected_answer,
          is_correct,
          points_awarded,
          attempted_at;
        `,
        [
          userId,
          questionId,
          selectedAnswer,
          questionPoints,
        ]
      );

      // First correct answer → award points
      if (rewardedAttempt.rows.length > 0) {
        const updatedUser = await client.query(
          `
          UPDATE users
          SET
          total_points = total_points + $1,
          current_level = CASE
          WHEN total_points + $1 >= 200 THEN 'Digital Hero'
          WHEN total_points + $1 >= 100 THEN 'Cyber Guardian'
          WHEN total_points + $1 >= 50 THEN 'Digital Learner'
          ELSE 'Digital Explorer'
       END
          WHERE id = $2
          RETURNING id,total_points,current_level;`,
          [questionPoints, userId]);

        await client.query("COMMIT");

        return {
          attempt: rewardedAttempt.rows[0],
          totalPoints: updatedUser.rows[0].total_points,
          currentLevel: updatedUser.rows[0].current_level,
        };
      }
    }

    // ========================================
    // WRONG ANSWER OR REPEATED CORRECT ANSWER
    // ========================================
    const attemptResult = await client.query(
      `
      INSERT INTO question_attempts (
        user_id,
        question_id,
        selected_answer,
        is_correct,
        points_awarded
      )
      VALUES ($1, $2, $3, $4, 0)
      RETURNING
        id,
        user_id,
        question_id,
        selected_answer,
        is_correct,
        points_awarded,
        attempted_at;
      `,
      [
        userId,
        questionId,
        selectedAnswer,
        isCorrect,
      ]
    );

    const userResult = await client.query(
      `
      SELECT
        total_points,
        current_level
      FROM users
      WHERE id = $1
      LIMIT 1;
      `,
      [userId]
    );

    await client.query("COMMIT");

    return {
      attempt: attemptResult.rows[0],
      totalPoints: userResult.rows[0].total_points,
      currentLevel: userResult.rows[0].current_level,
    };

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Record question attempt error:",
      error
    );

    throw error;

  } finally {
    client.release();
  }
};