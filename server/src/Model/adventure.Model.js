import pool from "../config/db.js";

export const getAllAdventures = async () => {
  const result = await pool.query(`SELECT id,title_ar,title_en,description_ar,description_en,icon,badge_name,completion_points,display_order,is_active,created_at
    FROM adventures WHERE is_active = true ORDER BY display_order ASC;`);
  return result.rows;
};

export const getAdventureById = async (id) => {
  const result = await pool.query(`SELECT id,title_ar,title_en,description_ar,description_en,icon,badge_name,completion_points,display_order,is_active,created_at 
    FROM adventures WHERE id = $1 AND is_active = true LIMIT 1;`,[id]);
  return result.rows[0];
};