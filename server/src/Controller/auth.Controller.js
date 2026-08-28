import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { register } from "../Model/auth.Model.js";
import { getUserByNickname, getUserById } from "../Model/user.Model.js";
import {generateAccessToken,generateRefreshToken} from "../Utils/Tokens.Utils.js";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const isProd = process.env.NODE_ENV === "production";
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/",
};
function publicUser(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    age_group: user.age_group,
    avatar: user.avatar,
    total_points: user.total_points,
    current_level: user.current_level,
    created_at: user.created_at,
  };
}
function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}
export async function registerController(req, res) {
  try {
    const { nickname, password, age_group, avatar } = req.body;
    const hashed_password = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await register(nickname, hashed_password, age_group, avatar);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Nickname already exists",
      });
    }

    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
export async function loginController(req, res) {
  try {
    const { nickname, password } = req.body;

    const user = await getUserByNickname(nickname);

    console.log("User found:", !!user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.hashed_password
    );

    console.log("Password match:", passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    setAuthCookies(
      res,
      accessToken,
      refreshToken
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: publicUser(user),
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

export async function refreshTokenController(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const user = await getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newAccessToken = generateAccessToken(user);
    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
}

export async function meController(req, res) {
  try {

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await getUserById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: publicUser(user),
    });

  } catch (error) {
    console.error("ME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}