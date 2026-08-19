import pool from "../config/db.js";


export const getUserByNickname = async (nickname) => {
  const result = await pool.query(`SELECT
      id,nickname,hashed_password,age_group,avatar,total_points,current_level,created_at from users where nickname = $1`,
      [nickname]
    );

  return result.rows[0];
};



export const getUserById = async (id) => {
  const result = await pool.query(` SELECT
      id,nickname,age_group,avatar,total_points,current_level,created_at from users WHERE id = $1
    LIMIT 1;`,[id]);

  return result.rows[0];
};