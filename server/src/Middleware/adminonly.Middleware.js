import jwt from "jsonwebtoken";
import { getAdminById } from "../Model/admin.Model.js";

const isProd =
  process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite:
    isProd &&
    process.env.COOKIE_SAME_SITE === "none"
      ? "none"
      : "lax",
  path: "/",
};

const clearAdminCookies = (res) => {
  res.clearCookie(
    "adminAccessToken",
    cookieOptions,
  );

  res.clearCookie(
    "adminTwoFactorChallenge",
    cookieOptions,
  );
};

const accessHasExpired = (admin) => {
  if (!admin?.access_expires_at) {
    return false;
  }

  const expiresAt =
    new Date(
      admin.access_expires_at,
    ).getTime();

  return (
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  );
};

export const protectAdmin = async (
  req,
  res,
  next,
) => {
  const token =
    req.cookies.adminAccessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "ADMIN_NOT_AUTHENTICATED",
      message:
        "Admin not authenticated",
    });
  }

  try {
    const decoded =
      jwt.verify(
        token,
        process.env.ADMIN_JWT_SECRET,
      );

    if (
      decoded.type !== "admin" ||
      !decoded.id
    ) {
      clearAdminCookies(res);

      return res.status(403).json({
        success: false,
        code:
          "ADMIN_ACCESS_REQUIRED",
        message:
          "Admin access required",
      });
    }

    const admin =
      await getAdminById(
        decoded.id,
      );

    if (!admin) {
      clearAdminCookies(res);

      return res.status(401).json({
        success: false,
        code: "ADMIN_NOT_FOUND",
        message:
          "Admin account not found",
      });
    }

    if (
      admin.is_enabled !== true
    ) {
      clearAdminCookies(res);

      return res.status(403).json({
        success: false,
        code:
          "ADMIN_ACCOUNT_DISABLED",
        message:
          "This administrator account is disabled.",
      });
    }

    if (
      accessHasExpired(admin)
    ) {
      clearAdminCookies(res);

      return res.status(403).json({
        success: false,
        code:
          "ADMIN_ACCESS_EXPIRED",
        message:
          "This administrator access has expired.",
      });
    }

    if (
      admin.role !== "admin" &&
      admin.role !== "test_admin"
    ) {
      clearAdminCookies(res);

      return res.status(403).json({
        success: false,
        code:
          "ADMIN_ROLE_INVALID",
        message:
          "This administrator role is not permitted.",
      });
    }

    req.admin = {
      ...decoded,

      id:
        admin.id,

      email:
        admin.email,

      role:
        admin.role,

      is_enabled:
        admin.is_enabled,

      access_expires_at:
        admin.access_expires_at ||
        null,
    };

    return next();
  } catch {
    clearAdminCookies(res);

    return res.status(401).json({
      success: false,
      code:
        "ADMIN_TOKEN_INVALID",
      message:
        "Invalid or expired admin token",
    });
  }
};

export const requireFullAdmin = (
  req,
  res,
  next,
) => {
  if (!req.admin?.id) {
    return res.status(401).json({
      success: false,
      code:
        "ADMIN_NOT_AUTHENTICATED",
      message:
        "Admin not authenticated",
    });
  }

  if (
    req.admin.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      code:
        "FULL_ADMIN_REQUIRED",
      message:
        "This action requires a full administrator account.",
    });
  }

  return next();
};
