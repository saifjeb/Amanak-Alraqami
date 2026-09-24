import { createAdminAuditLog } from "../Model/adminAudit.Model.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const numericIdFromSegments = (segments) => {
  const match = segments.find((segment) => /^[1-9]\d*$/.test(segment));

  return match || null;
};

const classifyAdminAction = (method, requestPath) => {
  const path = requestPath.split("?")[0];

  const segments = path.split("/").filter(Boolean);

  const resourceId = numericIdFromSegments(segments);

  if (path === "/logout") {
    return {
      action: "admin.logout",
      resourceType: "admin",
      resourceId: null,
    };
  }

  if (/^\/students\/\d+\/disable$/.test(path)) {
    return {
      action: "student.disable",
      resourceType: "student",
      resourceId,
    };
  }

  if (/^\/students\/\d+\/enable$/.test(path)) {
    return {
      action: "student.enable",
      resourceType: "student",
      resourceId,
    };
  }

  if (/^\/students\/\d+\/permanent$/.test(path)) {
    return {
      action: "student.permanent_delete",
      resourceType: "student",
      resourceId,
    };
  }

  if (path === "/adventures" && method === "POST") {
    return {
      action: "adventure.create",
      resourceType: "adventure",
      resourceId: null,
    };
  }

  if (/^\/adventures\/\d+$/.test(path)) {
    return {
      action: method === "DELETE" ? "adventure.trash" : "adventure.update",
      resourceType: "adventure",
      resourceId,
    };
  }

  if (/^\/adventures\/\d+\/image$/.test(path)) {
    return {
      action: "adventure.set_image",
      resourceType: "adventure",
      resourceId,
    };
  }

  if (/^\/trash\/adventures\/\d+\/restore$/.test(path)) {
    return {
      action: "adventure.restore",
      resourceType: "adventure",
      resourceId,
    };
  }

  if (/^\/trash\/adventures\/\d+\/permanent$/.test(path)) {
    return {
      action: "adventure.permanent_delete",
      resourceType: "adventure",
      resourceId,
    };
  }

  if (path === "/questions" && method === "POST") {
    return {
      action: "question.create",
      resourceType: "question",
      resourceId: null,
    };
  }

  if (/^\/questions\/\d+$/.test(path)) {
    return {
      action: method === "DELETE" ? "question.trash" : "question.update",
      resourceType: "question",
      resourceId,
    };
  }

  if (/^\/questions\/\d+\/image$/.test(path)) {
    return {
      action: "question.set_image",
      resourceType: "question",
      resourceId,
    };
  }

  if (/^\/trash\/questions\/\d+\/restore$/.test(path)) {
    return {
      action: "question.restore",
      resourceType: "question",
      resourceId,
    };
  }

  if (/^\/trash\/questions\/\d+\/permanent$/.test(path)) {
    return {
      action: "question.permanent_delete",
      resourceType: "question",
      resourceId,
    };
  }

  if (path === "/media/upload" && method === "POST") {
    return {
      action: "media.upload",
      resourceType: "media",
      resourceId: null,
    };
  }

  if (/^\/media\/\d+$/.test(path)) {
    return {
      action: "media.trash",
      resourceType: "media",
      resourceId,
    };
  }

  if (/^\/trash\/media\/\d+\/restore$/.test(path)) {
    return {
      action: "media.restore",
      resourceType: "media",
      resourceId,
    };
  }

  if (/^\/trash\/media\/\d+\/permanent$/.test(path)) {
    return {
      action: "media.permanent_delete",
      resourceType: "media",
      resourceId,
    };
  }

  return {
    action: `admin.${method.toLowerCase()}`,
    resourceType: segments[0] || "admin",
    resourceId,
  };
};

export const auditAdminAction = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const startedAt = Date.now();

  res.on("finish", () => {
    if (!req.admin?.id) {
      return;
    }

    const { action, resourceType, resourceId } = classifyAdminAction(
      req.method,
      req.path,
    );

    createAdminAuditLog({
      adminId: req.admin.id,

      adminEmail: req.admin.email || null,

      action,

      resourceType,

      resourceId,

      httpMethod: req.method,

      requestPath: req.originalUrl || req.path,

      statusCode: res.statusCode,

      ipAddress: req.ip || req.socket?.remoteAddress || null,

      userAgent: req.get("user-agent") || null,

      metadata: {
        duration_ms: Date.now() - startedAt,
      },
    }).catch((error) => {
      console.error("Admin audit log error:", error.message);
    });
  });

  return next();
};
