import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {registerParent,getParentByEmail,getParentById,getParentByIdForAuth,saveParentRefreshToken,clearParentRefreshToken} from "../Model/parents.Models.js";
import {generateParentAccessToken,generateParentRefreshToken,hashToken} from "../Utils/Tokens.Utils.js";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};
function publicParent(parent) {
  return {
    id: parent.id,
    name: parent.name,
    email: parent.email,
    created_at: parent.created_at,
  };
}
async function issueParentTokens(res, parent) {
  const accessToken = generateParentAccessToken(parent);
  const refreshToken = generateParentRefreshToken(parent);
  await saveParentRefreshToken(parent.id, hashToken(refreshToken));

  res.cookie("parentAccessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("parentRefreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export async function parentRegisterController(req, res) {
  try {
    const { name, email, password } = req.body;

    const hashed_password = await bcrypt.hash(password, SALT_ROUNDS);

    const parent = await registerParent(name, email, hashed_password);

    await issueParentTokens(res, parent);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",

      parent: publicParent(parent),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("Parent register error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function parentLoginController(req, res) {
  try {
    const { email, password } = req.body;

    const parent = await getParentByEmail(email);

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      parent.hashed_password,
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    await issueParentTokens(res, parent);

    return res.status(200).json({
      success: true,
      message: "Login successful",

      parent: publicParent(parent),
    });
  } catch (error) {
    console.error("Parent login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function parentLogoutController(req, res) {
  try {
    const refreshToken = req.cookies.parentRefreshToken;

    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.PARENT_REFRESH_SECRET,
      );

      await clearParentRefreshToken(decoded.id);
    }
  } catch (error) {
    console.error("Parent logout error:", error);
  }

  res.clearCookie("parentAccessToken", cookieOptions);

  res.clearCookie("parentRefreshToken", cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function parentMeController(req, res) {
  try {
    const parent = await getParentById(req.parent.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      parent: publicParent(parent),
    });
  } catch (error) {
    console.error("Parent me error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function parentRefreshController(req, res) {
  try {
    const refreshToken =
      req.cookies.parentRefreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }


    const decoded = jwt.verify(
      refreshToken,
      process.env.PARENT_REFRESH_SECRET
    );

    if (
      decoded.type !== "parent" ||
      !decoded.id
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const parent =
      await getParentByIdForAuth(decoded.id);

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    const incomingTokenHash =
      hashToken(refreshToken);

    if (
      !parent.refresh_token ||
      incomingTokenHash !== parent.refresh_token
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    await issueParentTokens(
      res,
      parent
    );

    return res.status(200).json({
      success: true,
      message:
        "Access token refreshed successfully",
    });

  } catch (error) {
    console.error(
      "Parent refresh error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired refresh token",
    });
  }
}