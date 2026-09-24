import {getAdminAuditLogs,getAdminAuditSummary} from "../Model/adminAudit.Model.js";
const toPositiveInteger = (value, fallback, max) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const text = String(value);

  if (!/^[1-9]\d*$/.test(text)) {
    return null;
  }

  const number = Number(text);

  if (!Number.isSafeInteger(number)) {
    return null;
  }

  return Math.min(number, max);
};

const setNoStore = (res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",

    Pragma: "no-cache",

    Expires: "0",

    "Surrogate-Control": "no-store",
  });
};

export const getAdminAuditLogsController = async (req, res, next) => {
  try {
    const limit = toPositiveInteger(req.query.limit, 30, 100);

    if (limit === null) {
      return res.status(400).json({
        success: false,
        message: "limit must be a positive integer",
      });
    }

    const [logs, summary] = await Promise.all([
      getAdminAuditLogs({
        limit,
        offset: 0,
      }),

      getAdminAuditSummary(),
    ]);

    setNoStore(res);

    return res.status(200).json({
      success: true,

      summary: {
        total_events: Number(summary?.total_events) || 0,

        events_last_24_hours: Number(summary?.events_last_24_hours) || 0,

        failed_events: Number(summary?.failed_events) || 0,

        last_event_at: summary?.last_event_at || null,
      },

      audit_logs: logs,
    });
  } catch (error) {
    return next(error);
  }
};