import pool from "../config/db.js";

export const getUserByNickname = async (nickname) => {
  const result = await pool.query(
  `SELECT id,nickname,hashed_password,age_group,avatar,total_points,current_level,created_at,last_login_at,last_active_at,is_enabled
  FROM users WHERE nickname = $1 LIMIT 1;`,[nickname], );
  return result.rows[0];
};

export const getUserById = async (id) => {
  const result = await pool.query(
  `SELECT id,nickname,age_group,avatar,total_points,current_level,created_at,last_login_at,last_active_at,is_enabled
  FROM users WHERE id = $1 LIMIT 1;`,[id],);
  return result.rows[0];
};

export const getAllUsers = async () => {
  const result = await pool.query(
  `SELECT id,nickname,age_group,avatar,total_points,current_level,created_at,last_login_at,last_active_at,is_enabled
  FROM users ORDER BY id ASC;`,);
  return result.rows;
};

export const updateUser = async (userId, userInfo) => {
  const result = await pool.query(
  `UPDATE users SET nickname = $1,age_group = $2,avatar = $3 WHERE id = $4 RETURNING id,nickname,age_group,avatar,total_points,current_level,created_at,last_login_at,last_active_at,is_enabled;`,
  [userInfo.nickname, userInfo.age_group, userInfo.avatar, userId],);
  return result.rows[0];
};

export const deleteUser = async (id) => {
  const result = await pool.query(
  `DELETE FROM users WHERE id = $1 RETURNING id;`,[id],);
  return result.rows[0];
};

export const updateUserLoginActivity = async (userId) => {
  const result = await pool.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP, last_active_at = CURRENT_TIMESTAMP
  WHERE id = $1 AND is_enabled = TRUE RETURNING id,nickname,age_group,avatar,total_points,current_level,created_at,last_login_at,last_active_at,is_enabled;`,[userId],);
  return result.rows[0];
};

export const updateUserLastActive = async (userId) => {
  const result = await pool.query(`UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_enabled = TRUE
  RETURNING id,nickname,age_group,avatar,total_points,current_level,created_at,last_login_at,last_active_at,is_enabled;`,[userId],);
  return result.rows[0];
};
