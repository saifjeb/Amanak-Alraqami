import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { getAdminByEmail, getAdminById } from "../Model/admin.Model.js";

import { createAdminAuditLog } from "../Model/adminAudit.Model.js";

import {
  getTwoFactorSettings,
  consumeTwoFactorTimeStep,
  useTwoFactorRecoveryCode,
} from "../Model/twoFactor.Model.js";

import {
  verifyTwoFactorToken,
  hashTwoFactorRecoveryCode,
} from "../Utils/twoFactor.Utils.js";

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

const createAdminAccessToken = (admin) => {
  return jwt.sign(
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
};

const createAdminTwoFactorChallengeToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      type: "admin_2fa_challenge",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: "5m",
    },
  );
};

const setAdminAccessCookie = (res, token) => {
  res.cookie("adminAccessToken", token, {
    ...adminCookieOptions,
    maxAge: 60 * 60 * 1000,
  });
};

const setAdminTwoFactorChallengeCookie = (res, token) => {
  res.cookie("adminTwoFactorChallenge", token, {
    ...adminCookieOptions,
    maxAge: 5 * 60 * 1000,
  });
};

const clearAdminTwoFactorChallenge = (res) => {
  res.clearCookie("adminTwoFactorChallenge", adminCookieOptions);
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

    const twoFactorSettings = await getTwoFactorSettings("admin", admin.id);

    if (twoFactorSettings?.two_factor_enabled) {
      const challengeToken = createAdminTwoFactorChallengeToken(admin);

      res.clearCookie("adminAccessToken", adminCookieOptions);

      setAdminTwoFactorChallengeCookie(res, challengeToken);

      await writeLoginAudit({
        req,
        admin,
        action: "admin.login_2fa_required",
        statusCode: 200,
        metadata: {
          result: "two_factor_required",
        },
      });

      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        message: "Authenticator verification required.",
      });
    }

    clearAdminTwoFactorChallenge(res);

    const token = createAdminAccessToken(admin);

    setAdminAccessCookie(res, token);

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
      requiresTwoFactor: false,
      message: "Admin logged in successfully",
      admin: publicAdmin(admin),
    });
  } catch (error) {
    return next(error);
  }
};

export const adminTwoFactorChallengeController = async (req, res, next) => {
  try {
    const challengeToken = req.cookies?.adminTwoFactorChallenge;

    if (!challengeToken) {
      return res.status(401).json({
        success: false,
        code: "TWO_FACTOR_CHALLENGE_REQUIRED",
        message: "Two-factor authentication challenge is missing or expired.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(challengeToken, process.env.ADMIN_JWT_SECRET);
    } catch {
      clearAdminTwoFactorChallenge(res);

      return res.status(401).json({
        success: false,
        code: "TWO_FACTOR_CHALLENGE_EXPIRED",
        message: "Two-factor authentication challenge is invalid or expired.",
      });
    }

    if (decoded.type !== "admin_2fa_challenge" || !decoded.id) {
      clearAdminTwoFactorChallenge(res);

      return res.status(401).json({
        success: false,
        message: "Invalid two-factor authentication challenge.",
      });
    }

    const admin = await getAdminById(decoded.id);

    if (!admin) {
      clearAdminTwoFactorChallenge(res);

      return res.status(401).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    const settings = await getTwoFactorSettings("admin", admin.id);

    if (
      !settings ||
      !settings.two_factor_enabled ||
      !settings.two_factor_secret_encrypted
    ) {
      clearAdminTwoFactorChallenge(res);

      return res.status(400).json({
        success: false,
        code: "TWO_FACTOR_NOT_ENABLED",
        message: "Two-step verification is not enabled.",
      });
    }

    const token =
      typeof req.body?.token === "string" ? req.body.token.trim() : "";

    const recoveryCode =
      typeof req.body?.recoveryCode === "string"
        ? req.body.recoveryCode.trim()
        : "";

    if (Boolean(token) === Boolean(recoveryCode)) {
      return res.status(400).json({
        success: false,
        message: "Provide either an authenticator code or a recovery code.",
      });
    }

    let secondFactorValid = false;

    let method = null;

    if (token) {
      if (!/^\d{6}$/.test(token)) {
        return res.status(400).json({
          success: false,
          message: "Authenticator code must contain exactly 6 digits.",
        });
      }

      const verification = await verifyTwoFactorToken({
        encryptedSecret: settings.two_factor_secret_encrypted,
        token,
        lastUsedTimeStep: settings.two_factor_last_used_step,
      });

      if (verification.valid) {
        const consumed = await consumeTwoFactorTimeStep({
          accountType: "admin",
          accountId: admin.id,
          timeStep: verification.timeStep,
        });

        if (consumed) {
          secondFactorValid = true;
          method = "totp";
        }
      }
    }

    if (recoveryCode) {
      const codeHash = hashTwoFactorRecoveryCode({
        accountType: "admin",
        accountId: admin.id,
        code: recoveryCode,
      });

      const consumed = await useTwoFactorRecoveryCode({
        accountType: "admin",
        accountId: admin.id,
        codeHash,
      });

      if (consumed) {
        secondFactorValid = true;
        method = "recovery_code";
      }
    }

    if (!secondFactorValid) {
      await writeLoginAudit({
        req,
        admin,
        action: "admin.login_2fa_failed",
        statusCode: 401,
        metadata: {
          reason: "invalid_second_factor",
        },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid or already used authentication code.",
      });
    }

    const accessToken = createAdminAccessToken(admin);

    setAdminAccessCookie(res, accessToken);

    clearAdminTwoFactorChallenge(res);

    await writeLoginAudit({
      req,
      admin,
      action: "admin.login_success",
      statusCode: 200,
      metadata: {
        result: "success",
        secondFactor: method,
      },
    });

    return res.status(200).json({
      success: true,
      requiresTwoFactor: false,
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

  res.clearCookie("adminTwoFactorChallenge", adminCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
};
