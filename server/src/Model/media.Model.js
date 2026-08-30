import pool from "../config/db.js";

export const createMedia = async ({
  originalName,
  storedName,
  mimeType,
  fileSize,
  filePath,
  adminId,
}) => {
  const result = await pool.query(
    `
    INSERT INTO media (
      original_name,
      stored_name,
      mime_type,
      file_size,
      file_path,
      uploaded_by_admin_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      original_name,
      stored_name,
      mime_type,
      file_size,
      file_path,
      uploaded_by_admin_id,
      created_at,
      deleted_at;
    `,
    [
      originalName,
      storedName,
      mimeType,
      fileSize,
      filePath,
      adminId,
    ],
  );

  return result.rows[0];
};

export const getActiveMedia = async () => {
  const result = await pool.query(`
    SELECT
      id,
      original_name,
      stored_name,
      mime_type,
      file_size,
      file_path,
      uploaded_by_admin_id,
      created_at,
      deleted_at
    FROM media
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC;
  `);

  return result.rows;
};

export const getTrashedMedia = async () => {
  const result = await pool.query(`
    SELECT
      id,
      original_name,
      stored_name,
      mime_type,
      file_size,
      file_path,
      uploaded_by_admin_id,
      created_at,
      deleted_at
    FROM media
    WHERE deleted_at IS NOT NULL
    ORDER BY deleted_at DESC;
  `);

  return result.rows;
};

export const getMediaById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      id,
      original_name,
      stored_name,
      mime_type,
      file_size,
      file_path,
      uploaded_by_admin_id,
      created_at,
      deleted_at
    FROM media
    WHERE id = $1;
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const trashMedia = async (id) => {
  const result = await pool.query(
    `
    UPDATE media
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING *;
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const restoreMedia = async (id) => {
  const result = await pool.query(
    `
    UPDATE media
    SET deleted_at = NULL
    WHERE id = $1
      AND deleted_at IS NOT NULL
    RETURNING *;
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const permanentDeleteMedia = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM media
    WHERE id = $1
      AND deleted_at IS NOT NULL
    RETURNING *;
    `,
    [id],
  );

  return result.rows[0] || null;
};