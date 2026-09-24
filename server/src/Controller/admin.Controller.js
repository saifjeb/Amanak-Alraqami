import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getAdminByEmail, getAdminById } from "../Model/admin.Model.js";
import { createAdminAuditLog } from "../Model/adminAudit.Model.js";

const isProd = process.env.NODE_ENV === "production";
const adminCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};

const publicAdmin = (admin) => {
  if (!admin) {
    return admin;
  }

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    created_at: admin.created_at,
  };
};

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
};

const writeLoginAudit = async ({
  req,
  admin = null,
  email = null,
  action,
  statusCode,
  metadata = {},
}) => {
  try {
    await createAdminAuditLog({
      adminId: admin?.id || null,
      adminEmail: admin?.email || email || null,
      action,
      resourceType: "admin_auth",
      resourceId: admin?.id ? String(admin.id) : null,
      httpMethod: req.method,
      requestPath: req.originalUrl,
      statusCode,
      ipAddress: getClientIp(req),
      userAgent: req.get("user-agent") || null,
      metadata,
    });
  } catch (error) {
    console.error("Admin login audit error:", error);
  }
};

export const adminLoginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await getAdminByEmail(email);

    if (!admin) {
      await writeLoginAudit({
        req,
        email,
        action: "admin.login_failed",
        statusCode: 401,
        metadata: {
          reason: "invalid_credentials",
        },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      admin.hashed_password,
    );

    if (!passwordCorrect) {
      await writeLoginAudit({
        req,
        admin,
        action: "admin.login_failed",
        statusCode: 401,
        metadata: {
          reason: "invalid_credentials",
        },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        type: "admin",
      },
      process.env.ADMIN_JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    res.cookie("adminAccessToken", token, {
      ...adminCookieOptions,
      maxAge: 60 * 60 * 1000,
    });

    await writeLoginAudit({
      req,
      admin,
      action: "admin.login_success",
      statusCode: 200,
      metadata: {
        result: "success",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      admin: publicAdmin(admin),
    });
  } catch (error) {
    return next(error);
  }
};

export const adminMeController = async (req, res, next) => {
  try {
    const admin = await getAdminById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      admin: publicAdmin(admin),
    });
  } catch (error) {
    return next(error);
  }
};

export const adminLogoutController = async (req, res) => {
  res.clearCookie("adminAccessToken", adminCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
};
