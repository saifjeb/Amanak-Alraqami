
import pool from "../config/db.js";

export const getTestAdminRegistrationSetting =
  async () => {
    const result =
      await pool.query(
        `
        SELECT
          registration_enabled,
          updated_at
        FROM test_admin_access_settings
        WHERE id = 1
        LIMIT 1;
        `,
      );

    return result.rows[0] || null;
  };

export const setTestAdminRegistrationEnabled =
  async (enabled) => {
    const result =
      await pool.query(
        `
        UPDATE test_admin_access_settings
        SET
          registration_enabled = $1,
          updated_at = NOW()
        WHERE id = 1
        RETURNING
          registration_enabled,
          updated_at;
        `,
        [
          enabled,
        ],
      );

    return result.rows[0] || null;
  };

export const createTestAdmin =
  async ({
    name,
    email,
    hashedPassword,
  }) => {
    const result =
      await pool.query(
        `
        INSERT INTO admins (
          name,
          email,
          hashed_password,
          role,
          is_enabled,
          access_expires_at
        )
        SELECT
          $1,
          $2,
          $3,
          'test_admin',
          TRUE,
          NOW() + INTERVAL '30 days'
        FROM test_admin_access_settings
        WHERE id = 1
          AND registration_enabled = TRUE
        RETURNING
          id,
          name,
          email,
          role,
          is_enabled,
          access_expires_at,
          created_at;
        `,
        [
          name,
          email.toLowerCase(),
          hashedPassword,
        ],
      );

    return result.rows[0] || null;
  };

export const listTestAdmins =
  async () => {
    const result =
      await pool.query(
        `
        SELECT
          id,
          name,
          email,
          role,
          is_enabled,
          access_expires_at,
          created_at,
          (
            access_expires_at IS NOT NULL
            AND
            access_expires_at <= NOW()
          ) AS is_expired
        FROM admins
        WHERE role = 'test_admin'
        ORDER BY created_at DESC;
        `,
      );

    return result.rows;
  };

export const getTestAdminById =
  async (id) => {
    const result =
      await pool.query(
        `
        SELECT
          id,
          name,
          email,
          role,
          is_enabled,
          access_expires_at,
          created_at,
          (
            access_expires_at IS NOT NULL
            AND
            access_expires_at <= NOW()
          ) AS is_expired
        FROM admins
        WHERE id = $1
          AND role = 'test_admin'
        LIMIT 1;
        `,
        [
          id,
        ],
      );

    return result.rows[0] || null;
  };

export const setTestAdminEnabled =
  async (
    id,
    enabled,
  ) => {
    const result =
      await pool.query(
        `
        UPDATE admins
        SET
          is_enabled = $2
        WHERE id = $1
          AND role = 'test_admin'
          AND (
            $2 = FALSE
            OR
            access_expires_at > NOW()
          )
        RETURNING
          id,
          name,
          email,
          role,
          is_enabled,
          access_expires_at,
          created_at;
        `,
        [
          id,
          enabled,
        ],
      );

    return result.rows[0] || null;
  };
