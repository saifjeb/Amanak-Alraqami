import pool from "../config/db.js";

export const registerParent = async (name, email, hashed_password) => {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `
    INSERT INTO parents (
      name,
      email,
      hashed_password
    )
    VALUES ($1, $2, $3)

    RETURNING
      id,
      name,
      email,
      email_verified_at,
      created_at;
    `,
    [name, normalizedEmail, hashed_password],
  );

  return result.rows[0];
};

export const getParentByEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      hashed_password,
      refresh_token,
      email_verified_at,
      created_at
    FROM parents
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1;
    `,
    [normalizedEmail],
  );

  return result.rows[0] || null;
};

export const getParentById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      email_verified_at,
      created_at
    FROM parents
    WHERE id = $1
    LIMIT 1;
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const saveParentRefreshToken = async (id, hashedToken) => {
  await pool.query(
    `
    UPDATE parents
    SET refresh_token = $1
    WHERE id = $2;
    `,
    [hashedToken, id],
  );
};

export const clearParentRefreshToken = async (id) => {
  await pool.query(
    `
    UPDATE parents
    SET refresh_token = NULL
    WHERE id = $1;
    `,
    [id],
  );
};

export const getParentByIdForAuth = async (id) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      hashed_password,
      refresh_token,
      email_verified_at,
      created_at
    FROM parents
    WHERE id = $1
    LIMIT 1;
    `,
    [id],
  );

  return result.rows[0] || null;
};
