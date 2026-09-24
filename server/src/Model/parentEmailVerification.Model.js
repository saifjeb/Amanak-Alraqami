import pool from "../config/db.js";

export const deleteActiveParentVerificationCodes = async (parentId) => {
  await pool.query(
    `
    DELETE FROM parent_email_verification_codes
    WHERE parent_id = $1
      AND used_at IS NULL;
    `,
    [parentId],
  );
};

export const createParentVerificationCode = async ({
  parentId,
  codeDigest,
  expiresAt,
}) => {
  const result = await pool.query(
    `
    INSERT INTO parent_email_verification_codes (
      parent_id,
      code_hash,
      expires_at
    )
    VALUES ($1, $2, $3)

    RETURNING
      id,
      parent_id,
      expires_at,
      created_at;
    `,
    [parentId, codeDigest, expiresAt],
  );

  return result.rows[0];
};

export const getValidParentVerificationCode = async (parentId, codeDigest) => {
  const result = await pool.query(
    `
    SELECT
      id,
      parent_id,
      code_hash,
      expires_at,
      used_at,
      created_at
    FROM parent_email_verification_codes
    WHERE parent_id = $1
      AND code_hash = $2
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    `,
    [parentId, codeDigest],
  );

  return result.rows[0] || null;
};

export const markParentVerificationCodeUsed = async (id) => {
  const result = await pool.query(
    `
    UPDATE parent_email_verification_codes
    SET used_at = NOW()
    WHERE id = $1
      AND used_at IS NULL

    RETURNING
      id,
      used_at;
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const markParentEmailVerified = async (parentId) => {
  const result = await pool.query(
    `
    UPDATE parents
    SET email_verified_at = NOW()
    WHERE id = $1

    RETURNING
      id,
      name,
      email,
      email_verified_at;
    `,
    [parentId],
  );

  return result.rows[0] || null;
};

export const verifyParentEmailWithCode = async ({ parentId, codeDigest }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const codeResult = await client.query(
      `
      SELECT
        id,
        parent_id
      FROM parent_email_verification_codes
      WHERE parent_id = $1
        AND code_hash = $2
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      FOR UPDATE
      LIMIT 1;
      `,
      [parentId, codeDigest],
    );

    const verificationCode = codeResult.rows[0];

    if (!verificationCode) {
      await client.query("ROLLBACK");
      return null;
    }

    const parentResult = await client.query(
      `
      UPDATE parents
      SET email_verified_at = NOW()
      WHERE id = $1

      RETURNING
        id,
        name,
        email,
        email_verified_at;
      `,
      [parentId],
    );

    const parent = parentResult.rows[0];

    if (!parent) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
      UPDATE parent_email_verification_codes
      SET used_at = NOW()
      WHERE parent_id = $1
        AND used_at IS NULL;
      `,
      [parentId],
    );

    await client.query("COMMIT");

    return parent;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getParentVerificationStatus = async (parentId) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      email_verified_at
    FROM parents
    WHERE id = $1
    LIMIT 1;
    `,
    [parentId],
  );

  return result.rows[0] || null;
};
