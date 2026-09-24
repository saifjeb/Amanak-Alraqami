import pool from "../config/db.js";

export const createAdminAuditLog = async ({
  adminId,
  adminEmail,
  action,
  resourceType,
  resourceId,
  httpMethod,
  requestPath,
  statusCode,
  ipAddress,
  userAgent,
  metadata = {},
}) => {
  const result = await pool.query(
    `
    INSERT INTO admin_audit_logs (
      admin_id,
      admin_email,
      action,
      resource_type,
      resource_id,
      http_method,
      request_path,
      status_code,
      ip_address,
      user_agent,
      metadata
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11::jsonb
    )
    RETURNING
      id,
      admin_id,
      admin_email,
      action,
      resource_type,
      resource_id,
      http_method,
      request_path,
      status_code,
      ip_address,
      user_agent,
      metadata,
      created_at;
    `,
    [
      adminId ?? null,
      adminEmail ?? null,
      action,
      resourceType || "admin",
      resourceId ?? null,
      httpMethod,
      requestPath,
      statusCode,
      ipAddress ?? null,
      userAgent ?? null,
      JSON.stringify(metadata || {}),
    ],
  );

  return result.rows[0] || null;
};

export const getAdminAuditLogs = async ({ limit = 30, offset = 0 } = {}) => {
  const result = await pool.query(
    `
    SELECT
      id,
      admin_id,
      admin_email,
      action,
      resource_type,
      resource_id,
      http_method,
      request_path,
      status_code,
      ip_address,
      user_agent,
      metadata,
      created_at
    FROM admin_audit_logs
    ORDER BY
      created_at DESC,
      id DESC
    LIMIT $1
    OFFSET $2;
    `,
    [limit, offset],
  );

  return result.rows;
};

export const getAdminAuditSummary = async () => {
  const result = await pool.query(
    `
        SELECT
          COUNT(*)::integer
            AS total_events,

          COUNT(*) FILTER (
            WHERE created_at >=
              CURRENT_TIMESTAMP -
              INTERVAL '24 hours'
          )::integer
            AS events_last_24_hours,

          COUNT(*) FILTER (
            WHERE status_code >= 400
          )::integer
            AS failed_events,

          MAX(created_at)
            AS last_event_at

        FROM admin_audit_logs;
        `,
  );

  return result.rows[0] || null;
};
