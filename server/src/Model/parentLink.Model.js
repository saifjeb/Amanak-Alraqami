import pool from "../config/db.js";

export const createLinkCode = async (parentId, code) => {
  await pool.query(`DELETE FROM link_codes WHERE parent_id = $1 AND used_at IS NULL;`,[parentId],);
  const result = await pool.query(`INSERT INTO link_codes (code,parent_id,expires_at)
    VALUES ($1,$2,CURRENT_TIMESTAMP + INTERVAL '10 minutes') RETURNING code,parent_id,expires_at,created_at;`,[code, parentId],);
  return result.rows[0];
};

export const useLinkCode = async (code, childId) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const codeResult = await client.query(`SELECT code,parent_id,expires_at,used_at FROM link_codes WHERE code = $1 FOR UPDATE;`,[code],);
    if (codeResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        reason: "not_found",
      };
    }

    const linkCode = codeResult.rows[0];
    if (linkCode.used_at) {
      await client.query("ROLLBACK");
      return {
        success: false,
        reason: "used",
      };
    }

    const expiryCheck = await client.query(`SELECT expires_at > CURRENT_TIMESTAMP AS valid FROM link_codes WHERE code = $1;`,[code],);

    if (!expiryCheck.rows[0].valid) {
      await client.query("ROLLBACK");
      return {
        success: false,
        reason: "expired",
      };
    }

    const linkResult = await client.query(
      `INSERT INTO parent_children (parent_id,child_id) VALUES ($1, $2) ON CONFLICT (parent_id, child_id) DO NOTHING
       RETURNING id,parent_id,child_id,created_at;`,[linkCode.parent_id, childId]);
       await client.query(`UPDATE link_codes SET used_at = CURRENT_TIMESTAMP WHERE code = $1;`,[code],);
      await client.query("COMMIT");

    return {
      success: true,
      alreadyLinked: linkResult.rows.length === 0,
      link: linkResult.rows[0] || null,
      parentId: linkCode.parent_id,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Use link code model error:", error);

    throw error;
  } finally {
    client.release();
  }
};

export const getLinkedChildren = async (parentId) => {const result = await pool.query(`SELECT u.id,u.nickname,u.age_group,u.avatar,u.total_points,u.current_level,pc.created_at AS linked_at
    FROM parent_children pc JOIN users u ON u.id = pc.child_id WHERE pc.parent_id = $1 ORDER BY pc.created_at ASC;`,
    [parentId],);
    return result.rows;
};
