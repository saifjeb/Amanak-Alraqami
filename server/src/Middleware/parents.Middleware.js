import jwt from "jsonwebtoken";
import { getParentById } from "../Model/parents.Models.js";
import { clearParentRefreshToken } from "../Model/parents.Models.js";

const isProd =
  process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};

const clearParentCookies = (res) => {
  res.clearCookie(
    "parentAccessToken",
    cookieOptions
  );

  res.clearCookie(
    "parentRefreshToken",
    cookieOptions
  );
};

export const protectParent = async (
  req,
  res,
  next
) => {
  const token =
    req.cookies.parentAccessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Not authenticated",
    });
  }

  try {
    const decoded =
      jwt.verify(
        token,
        process.env
          .PARENT_JWT_SECRET
      );

    if (
      decoded.type !== "parent" ||
      !decoded.id
    ) {
      clearParentCookies(res);

      return res.status(403).json({
        success: false,
        message:
          "Parent access required",
      });
    }

    const parent =
      await getParentById(
        decoded.id
      );

    if (!parent) {
      clearParentCookies(res);

      return res.status(401).json({
        success: false,
        message:
          "Parent account not found",
      });
    }

    if (!parent.email_verified_at) {
      await clearParentRefreshToken(
        parent.id
      );

      clearParentCookies(res);

      return res.status(403).json({
        success: false,
        requiresEmailVerification:
          true,
        code:
          "EMAIL_NOT_VERIFIED",
        message:
          "Please verify your email before signing in.",
      });
    }

    req.parent = {
      ...decoded,
      id: parent.id,
      email: parent.email,
    };

    return next();
  } catch {
    clearParentCookies(res);

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired parent token",
    });
  }
};