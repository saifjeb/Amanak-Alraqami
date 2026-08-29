import pool from "../config/db.js";

export const getAdminByEmail = async (email) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      hashed_password,
      created_at
    FROM admins
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1;
    `,
    [email]
  );

  return result.rows[0] || null;
};


export const getAdminById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      created_at
    FROM admins
    WHERE id = $1
    LIMIT 1;
    `,
    [id]
  );

  return result.rows[0] || null;
};


export const createAdmin = async ({
  name,
  email,
  hashedPassword,
}) => {
  const result = await pool.query(
    `
    INSERT INTO admins (
      name,
      email,
      hashed_password
    )
    VALUES ($1, $2, $3)

    RETURNING
      id,
      name,
      email,
      created_at;
    `,
    [
      name,
      email.toLowerCase(),
      hashedPassword,
    ]
  );

  return result.rows[0];
};