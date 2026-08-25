import pool from "../config/db.js";


// ========================================
// REGISTER PARENT
// ========================================

export const registerParent = async (
  name,
  email,
  hashed_password
) => {
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
      created_at;
    `,
    [
      name,
      email,
      hashed_password,
    ]
  );

  return result.rows[0];
};


// ========================================
// GET PARENT BY EMAIL
// ========================================

export const getParentByEmail = async (
  email
) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      hashed_password,
      refresh_token,
      created_at
    FROM parents
    WHERE email = $1
    LIMIT 1;
    `,
    [email]
  );

  return result.rows[0];
};


// ========================================
// GET PARENT BY ID
// ========================================

export const getParentById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      created_at
    FROM parents
    WHERE id = $1
    LIMIT 1;
    `,
    [id]
  );

  return result.rows[0];
};


// ========================================
// SAVE REFRESH TOKEN HASH
// ========================================

export const saveParentRefreshToken = async (
  id,
  hashedToken
) => {
  await pool.query(
    `
    UPDATE parents
    SET refresh_token = $1
    WHERE id = $2;
    `,
    [
      hashedToken,
      id,
    ]
  );
};

export const clearParentRefreshToken = async (
  id
) => {
  await pool.query(
    `
    UPDATE parents
    SET refresh_token = NULL
    WHERE id = $1;
    `,
    [id]
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
      created_at
    FROM parents
    WHERE id = $1
    LIMIT 1;
    `,
    [id]
  );

  return result.rows[0];
};