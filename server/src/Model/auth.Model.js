import pool from "../config/db.js";

export const register = async (
  nickname,
  hashed_password,
  age_group,
  avatar = "avatar1"
) => {
  const result = await pool.query(
    `
    INSERT INTO users (
      nickname,
      hashed_password,
      age_group,
      avatar
    )
    VALUES ($1, $2, $3, $4)

    RETURNING
      id,
      nickname,
      age_group,
      avatar,
      total_points,
      current_level,
      created_at;
    `,
    [
      nickname,
      hashed_password,
      age_group,
      avatar
    ]
  );

  return result.rows[0];
}
export const saveRefreshTokens = async(id,token)=>{
    await pool.query(``)
}