import pool from "../config/db.js";

export const deleteActivePasswordResetTokens = async (
  accountType,
  accountId,
) => {
  await pool.query(
    `
    DELETE FROM password_reset_tokens
    WHERE account_type = $1
      AND account_id = $2
      AND used_at IS NULL;
    `,
    [accountType, accountId],
  );
};

export const createPasswordResetToken = async ({
  accountType,
  accountId,
  tokenHash,
  expiresAt,
}) => {
  const result = await pool.query(
    `
    INSERT INTO password_reset_tokens (
      account_type,
      account_id,
      token_hash,
      expires_at
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      account_type,
      account_id,
      expires_at,
      created_at;
    `,
    [accountType, accountId, tokenHash, expiresAt],
  );

  return result.rows[0];
};

export const getValidPasswordResetToken = async (tokenHash, accountType) => {
  const result = await pool.query(
    `
    SELECT
      id,
      account_type,
      account_id,
      token_hash,
      expires_at,
      used_at,
      created_at
    FROM password_reset_tokens
    WHERE token_hash = $1
      AND account_type = $2
      AND used_at IS NULL
      AND expires_at > NOW()
    LIMIT 1;
    `,
    [tokenHash, accountType],
  );

  return result.rows[0] || null;
};

export const markPasswordResetTokenUsed = async (id) => {
  const result = await pool.query(
    `
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE id = $1
      AND used_at IS NULL
    RETURNING id, used_at;
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const resetPasswordWithToken = async ({
  tokenHash,
  accountType,
  hashedPassword,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `
      SELECT
        id,
        account_id
      FROM password_reset_tokens
      WHERE token_hash = $1
        AND account_type = $2
        AND used_at IS NULL
        AND expires_at > NOW()
      FOR UPDATE
      LIMIT 1;
      `,
      [tokenHash, accountType],
    );

    const resetToken = tokenResult.rows[0];

    if (!resetToken) {
      await client.query("ROLLBACK");
      return null;
    }

    let accountResult;

    if (accountType === "parent") {
      accountResult = await client.query(
        `
        UPDATE parents
        SET
          hashed_password = $1,
          refresh_token = NULL
        WHERE id = $2
        RETURNING
          id,
          name,
          email;
        `,
        [hashedPassword, resetToken.account_id],
      );
    } else if (accountType === "admin") {
      accountResult = await client.query(
        `
        UPDATE admins
        SET hashed_password = $1
        WHERE id = $2
        RETURNING
          id,
          name,
          email;
        `,
        [hashedPassword, resetToken.account_id],
      );
    } else {
      await client.query("ROLLBACK");
      return null;
    }

    const account = accountResult.rows[0];

    if (!account) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE account_type = $1
        AND account_id = $2
        AND used_at IS NULL;
      `,
      [accountType, resetToken.account_id],
    );

    await client.query("COMMIT");

    return account;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteExpiredPasswordResetTokens = async () => {
  await pool.query(
    `
    DELETE FROM password_reset_tokens
    WHERE expires_at <= NOW()
       OR used_at IS NOT NULL;
    `,
  );
};
