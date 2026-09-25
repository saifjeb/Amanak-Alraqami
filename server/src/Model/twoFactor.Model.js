import pool from "../config/db.js";

function getTableName(accountType) {
  if (accountType === "parent") {
    return "parents";
  }

  if (accountType === "admin") {
    return "admins";
  }

  throw new Error("Invalid 2FA account type");
}

export async function getTwoFactorSettings(accountType, accountId) {
  const tableName = getTableName(accountType);

  const result = await pool.query(
    `
      SELECT
        id,
        email,
        two_factor_enabled,
        two_factor_secret_encrypted,
        two_factor_enabled_at,
        two_factor_last_used_step
      FROM ${tableName}
      WHERE id = $1
      LIMIT 1;
      `,
    [accountId],
  );

  return result.rows[0] || null;
}

export async function saveTwoFactorSetupSecret({
  accountType,
  accountId,
  encryptedSecret,
}) {
  const tableName = getTableName(accountType);

  const result = await pool.query(
    `
      UPDATE ${tableName}
      SET
        two_factor_secret_encrypted = $1,
        two_factor_enabled = FALSE,
        two_factor_enabled_at = NULL,
        two_factor_last_used_step = NULL
      WHERE id = $2

      RETURNING
        id,
        email,
        two_factor_enabled,
        two_factor_enabled_at,
        two_factor_last_used_step;
      `,
    [encryptedSecret, accountId],
  );

  return result.rows[0] || null;
}

export async function enableTwoFactorWithRecoveryCodes({
  accountType,
  accountId,
  timeStep,
  recoveryCodeHashes,
}) {
  const tableName = getTableName(accountType);

  if (!Array.isArray(recoveryCodeHashes) || recoveryCodeHashes.length === 0) {
    throw new Error("Recovery codes are required");
  }

  if (!Number.isSafeInteger(timeStep) || timeStep < 0) {
    throw new Error("Valid TOTP time step is required");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const accountResult = await client.query(
      `
        UPDATE ${tableName}
        SET
          two_factor_enabled = TRUE,
          two_factor_enabled_at = NOW(),
          two_factor_last_used_step = $1
        WHERE id = $2
          AND two_factor_secret_encrypted IS NOT NULL

        RETURNING
          id,
          email,
          two_factor_enabled,
          two_factor_enabled_at,
          two_factor_last_used_step;
        `,
      [timeStep, accountId],
    );

    const account = accountResult.rows[0];

    if (!account) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
      DELETE FROM two_factor_recovery_codes
      WHERE account_type = $1
        AND account_id = $2;
      `,
      [accountType, accountId],
    );

    for (const codeHash of recoveryCodeHashes) {
      await client.query(
        `
        INSERT INTO two_factor_recovery_codes (
          account_type,
          account_id,
          code_hash
        )
        VALUES ($1, $2, $3);
        `,
        [accountType, accountId, codeHash],
      );
    }

    await client.query("COMMIT");

    return account;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function consumeTwoFactorTimeStep({
  accountType,
  accountId,
  timeStep,
}) {
  const tableName = getTableName(accountType);

  if (!Number.isSafeInteger(timeStep) || timeStep < 0) {
    return null;
  }

  const result = await pool.query(
    `
      UPDATE ${tableName}
      SET
        two_factor_last_used_step = $1
      WHERE id = $2
        AND two_factor_enabled = TRUE
        AND (
          two_factor_last_used_step IS NULL
          OR two_factor_last_used_step < $1
        )

      RETURNING
        id,
        two_factor_last_used_step;
      `,
    [timeStep, accountId],
  );

  return result.rows[0] || null;
}

export async function rotateTwoFactorRecoveryCodes({
  accountType,
  accountId,
  timeStep,
  recoveryCodeHashes,
}) {
  const tableName = getTableName(accountType);

  if (!Number.isSafeInteger(timeStep) || timeStep < 0) {
    throw new Error("Valid TOTP time step is required");
  }

  if (!Array.isArray(recoveryCodeHashes) || recoveryCodeHashes.length === 0) {
    throw new Error("Recovery codes are required");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const accountResult = await client.query(
      `
        UPDATE ${tableName}
        SET
          two_factor_last_used_step = $1
        WHERE id = $2
          AND two_factor_enabled = TRUE
          AND two_factor_secret_encrypted IS NOT NULL
          AND (
            two_factor_last_used_step IS NULL
            OR two_factor_last_used_step < $1
          )

        RETURNING
          id,
          email,
          two_factor_enabled,
          two_factor_enabled_at,
          two_factor_last_used_step;
        `,
      [timeStep, accountId],
    );

    const account = accountResult.rows[0];

    if (!account) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
      DELETE FROM two_factor_recovery_codes
      WHERE account_type = $1
        AND account_id = $2;
      `,
      [accountType, accountId],
    );

    for (const codeHash of recoveryCodeHashes) {
      await client.query(
        `
        INSERT INTO two_factor_recovery_codes (
          account_type,
          account_id,
          code_hash
        )
        VALUES ($1, $2, $3);
        `,
        [accountType, accountId, codeHash],
      );
    }

    await client.query("COMMIT");

    return account;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function disableTwoFactor(accountType, accountId) {
  const tableName = getTableName(accountType);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        UPDATE ${tableName}
        SET
          two_factor_enabled = FALSE,
          two_factor_secret_encrypted = NULL,
          two_factor_enabled_at = NULL,
          two_factor_last_used_step = NULL
        WHERE id = $1

        RETURNING
          id,
          email,
          two_factor_enabled,
          two_factor_enabled_at;
        `,
      [accountId],
    );

    await client.query(
      `
      DELETE FROM two_factor_recovery_codes
      WHERE account_type = $1
        AND account_id = $2;
      `,
      [accountType, accountId],
    );

    await client.query("COMMIT");

    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteTwoFactorRecoveryCodes(accountType, accountId) {
  await pool.query(
    `
    DELETE FROM two_factor_recovery_codes
    WHERE account_type = $1
      AND account_id = $2;
    `,
    [accountType, accountId],
  );
}

export async function createTwoFactorRecoveryCode({
  accountType,
  accountId,
  codeHash,
}) {
  const result = await pool.query(
    `
      INSERT INTO two_factor_recovery_codes (
        account_type,
        account_id,
        code_hash
      )
      VALUES ($1, $2, $3)

      RETURNING
        id,
        account_type,
        account_id,
        created_at;
      `,
    [accountType, accountId, codeHash],
  );

  return result.rows[0];
}

export async function useTwoFactorRecoveryCode({
  accountType,
  accountId,
  codeHash,
}) {
  const result = await pool.query(
    `
      UPDATE two_factor_recovery_codes
      SET used_at = NOW()
      WHERE account_type = $1
        AND account_id = $2
        AND code_hash = $3
        AND used_at IS NULL

      RETURNING
        id,
        used_at;
      `,
    [accountType, accountId, codeHash],
  );

  return result.rows[0] || null;
}
