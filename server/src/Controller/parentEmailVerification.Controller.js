import { getParentByEmail } from "../Model/parents.Models.js";

import { verifyParentEmailWithCode } from "../Model/parentEmailVerification.Model.js";

import { hashEmailVerificationCode } from "../Utils/Tokens.Utils.js";

import { createAndSendParentVerificationCode } from "../Utils/parentEmailVerification.Utils.js";

const normalizeEmail = (email) => {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
};

export const verifyParentEmailController = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);

    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must contain exactly 6 digits.",
      });
    }

    const parent = await getParentByEmail(email);

    if (!parent) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    if (parent.email_verified_at) {
      return res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: "Email address is already verified.",
      });
    }

    const codeDigest = hashEmailVerificationCode(parent.id, code);

    const verifiedParent = await verifyParentEmailWithCode({
      parentId: parent.id,
      codeDigest,
    });

    if (!verifiedParent) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (error) {
    return next(error);
  }
};

export const resendParentVerificationCodeController = async (
  req,
  res,
  next,
) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const parent = await getParentByEmail(email);

    if (parent && !parent.email_verified_at) {
      await createAndSendParentVerificationCode(parent);
    }

    return res.status(200).json({
      success: true,
      message:
        "If an unverified account exists for this email, a new verification code has been sent.",
    });
  } catch (error) {
    return next(error);
  }
};
