import pool from "../config/db.js";

export const getAllAdventures = async () => {
  const result = await pool.query(`SELECT a.id,a.title_ar,a.title_en,a.description_ar,a.description_en,a.icon,a.badge_name,a.completion_points,a.display_order,a.is_active,a.created_at,
    CASE WHEN m.id IS NOT NULL AND m.deleted_at IS NULL THEN m.id ELSE NULL END AS image_media_id,
    CASE WHEN m.id IS NOT NULL AND m.deleted_at IS NULL THEN '/api/media/' || m.id ELSE NULL END AS image_url
    FROM adventures a LEFT JOIN media m
    ON m.id = a.image_media_id
    WHERE a.is_active = TRUE      
    AND a.deleted_at IS NULL
    ORDER BY a.display_order ASC;`);
  return result.rows;
};

export const getAdventureById = async (id) => {
  const result = await pool.query(
    `SELECT a.id,a.title_ar,a.title_en,a.description_ar,a.description_en,a.icon,a.badge_name,a.completion_points,a.display_order,a.is_active,a.created_at,
      CASE
        WHEN m.id IS NOT NULL
          AND m.deleted_at IS NULL
        THEN m.id
        ELSE NULL
      END AS image_media_id,

      CASE
        WHEN m.id IS NOT NULL
          AND m.deleted_at IS NULL
        THEN '/api/media/' || m.id
        ELSE NULL
      END AS image_url

    FROM adventures a
    LEFT JOIN media m
      ON m.id = a.image_media_id
    WHERE a.id = $1
      AND a.is_active = TRUE
      AND a.deleted_at IS NULL LIMIT 1; `,[id],);
  return result.rows[0] || null;
};

export const getAllAdventuresAdmin = async () => {
  const result = await pool.query(`
SELECT a.id,a.title_ar,a.title_en,a.description_ar,a.description_en,a.icon,a.badge_name,a.completion_points,a.display_order,a.is_active,a.created_at,a.deleted_at,a.image_media_id,
      CASE
        WHEN m.id IS NOT NULL
          AND m.deleted_at IS NULL
        THEN '/api/media/' || m.id
        ELSE NULL
      END AS image_url
    FROM adventures a

    LEFT JOIN media m
      ON m.id = a.image_media_id
    WHERE a.deleted_at IS NULL
    ORDER BY a.display_order ASC;`);
  return result.rows;
};

export const createAdventure = async ({
  titleAr,titleEn,descriptionAr,descriptionEn,icon,badgeName,completionPoints,displayOrder,isActive,}) => {
  const result = await pool.query(
    `INSERT INTO adventures (title_ar,title_en,description_ar,description_en,icon,badge_name,completion_points,display_order,is_active)
    VALUES ($1, $2, $3, $4, $5,$6, $7, $8, $9)
    RETURNING *;
    `,
    [
      titleAr,
      titleEn,
      descriptionAr || null,
      descriptionEn || null,
      icon || null,
      badgeName || null,
      completionPoints ?? 50,
      displayOrder,
      isActive ?? true,],);

  return result.rows[0];
};

export const updateAdventure = async (
  id,
  {
    titleAr,
    titleEn,
    descriptionAr,
    descriptionEn,
    icon,
    badgeName,
    completionPoints,
    displayOrder,
    isActive,
  },
) => {
  const result = await pool.query(
    `
    UPDATE adventures
    SET
      title_ar = COALESCE($1, title_ar),
      title_en = COALESCE($2, title_en),
      description_ar = COALESCE($3, description_ar),
      description_en = COALESCE($4, description_en),
      icon = COALESCE($5, icon),
      badge_name = COALESCE($6, badge_name),
      completion_points = COALESCE($7, completion_points),
      display_order = COALESCE($8, display_order),
      is_active = COALESCE($9, is_active)
    WHERE id = $10
      AND deleted_at IS NULL
    RETURNING *;
    `,
    [
      titleAr ?? null,
      titleEn ?? null,
      descriptionAr ?? null,
      descriptionEn ?? null,
      icon ?? null,
      badgeName ?? null,
      completionPoints ?? null,
      displayOrder ?? null,
      isActive ?? null,
      id,
    ],
  );

  return result.rows[0] || null;
};
export const moveAdventureToTrash = async (id) => {
  const result = await pool.query(
    `
    UPDATE adventures
    SET
      deleted_at = CURRENT_TIMESTAMP,
      is_active = FALSE
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING *;
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const getTrashedAdventures = async () => {
  const result = await pool.query(`SELECT id,title_ar,title_en,icon,badge_name,display_order,is_active,created_at,deleted_at
  FROM adventures WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC;`);
  return result.rows;
};

export const restoreAdventure = async (id) => {
  const result = await pool.query(
    `UPDATE adventures SET deleted_at = NULL, is_active = TRUE
    WHERE id = $1 AND deleted_at IS NOT NULL
    RETURNING *;`,[id],);
  return result.rows[0] || null;
};

export const permanentlyDeleteAdventure = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM adventures
    WHERE id = $1
      AND deleted_at IS NOT NULL
    RETURNING id, title_ar, title_en;
    `,
    [id],
  );

  return result.rows[0] || null;
};

export const setAdventureImage = async (adventureId, mediaId) => {
  const result = await pool.query(
    `
    UPDATE adventures
    SET image_media_id = $1
    WHERE id = $2
      AND deleted_at IS NULL
    RETURNING
      id,
      title_ar,
      title_en,
      image_media_id;
    `,
    [mediaId, adventureId],
  );

  return result.rows[0] || null;
};