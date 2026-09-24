import bcrypt from "bcrypt";

import { getAdminByEmail } from "../Model/admin.Model.js";

import { getParentByEmail } from "../Model/parents.Models.js";

import {
  deleteActivePasswordResetTokens,
  createPasswordResetToken,
  resetPasswordWithToken,
} from "../Model/passwordReset.Model.js";

import {
  generatePasswordResetToken,
  hashToken,
} from "../Utils/Tokens.Utils.js";

import { sendPasswordResetEmail } from "../Utils/passwordResetEmail.Utils.js";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

const RESET_TOKEN_LIFETIME = 15 * 60 * 1000;

const genericMessage =
  "If an account exists with this email, a password reset link will be sent.";

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};

const normalizeEmail = (email) => {
  if (typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
};

const processPasswordResetRequest = async ({ email, accountType }) => {
  const account =
    accountType === "admin"
      ? await getAdminByEmail(email)
      : await getParentByEmail(email);

  if (!account) {
    return;
  }

  const { token, tokenHash } = generatePasswordResetToken();

  const expiresAt = new Date(Date.now() + RESET_TOKEN_LIFETIME);

  await deleteActivePasswordResetTokens(accountType, account.id);

  await createPasswordResetToken({
    accountType,
    accountId: account.id,
    tokenHash,
    expiresAt,
  });

  await sendPasswordResetEmail({
    email: account.email,
    name: account.name,
    token,
    accountType,
  });
};

const processNewPassword = async ({ req, res, accountType }) => {
  const token =
    typeof req.body?.token === "string" ? req.body.token.trim() : "";

  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Password reset token is required.",
    });
  }

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired password reset link.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  if (password.length > 128) {
    return res.status(400).json({
      success: false,
      message: "Password must not exceed 128 characters.",
    });
  }

  try {
    const tokenHash = hashToken(token);

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const account = await resetPasswordWithToken({
      tokenHash,
      accountType,
      hashedPassword,
    });

    if (!account) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link.",
      });
    }

    if (accountType === "parent") {
      res.clearCookie("parentAccessToken", cookieOptions);

      res.clearCookie("parentRefreshToken", cookieOptions);
    }

    if (accountType === "admin") {
      res.clearCookie("adminAccessToken", cookieOptions);
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error(`${accountType} reset password error:`, error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  }
};

export const parentForgotPasswordController = async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!email || !email.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  processPasswordResetRequest({
    email,
    accountType: "parent",
  }).catch((error) => {
    console.error("Parent forgot password error:", error);
  });

  return res.status(200).json({
    success: true,
    message: genericMessage,
  });
};

export const adminForgotPasswordController = async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!email || !email.includes("@")) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  processPasswordResetRequest({
    email,
    accountType: "admin",
  }).catch((error) => {
    console.error("Admin forgot password error:", error);
  });

  return res.status(200).json({
    success: true,
    message: genericMessage,
  });
};

export const parentResetPasswordController = async (req, res) => {
  return processNewPassword({
    req,
    res,
    accountType: "parent",
  });
};

export const adminResetPasswordController = async (req, res) => {
  return processNewPassword({
    req,
    res,
    accountType: "admin",
  });
};
