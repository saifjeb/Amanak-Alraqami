import pool from "../config/db.js";

export const setStudentEnabledStatus = async (studentId,isEnabled) => {
  const result = await pool.query(
    `UPDATE users SET is_enabled = $2 WHERE id = $1 RETURNING id,nickname,age_group,avatar,total_points,current_level,last_login_at,last_active_at,is_enabled,created_at;`,
    [studentId, isEnabled]
  );
  return result.rows[0] || null;
};