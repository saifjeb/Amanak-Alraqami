import jwt from "jsonwebtoken";
import { getUserById, updateUserLastActive } from "../Model/user.Model.js";

const isProd = process.env.NODE_ENV === "production";
const clearAuthCookies = (res) => {
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };

  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
};

export const protect = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }

  try {
    const user = await updateUserLastActive(decoded.id);
    if (!user) {
      const existingUser = await getUserById(decoded.id);
      clearAuthCookies(res);
      if (existingUser && existingUser.is_enabled === false) {
        return res.status(403).json({
          success: false,
          message: "Account is disabled",
        });
      }

      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    req.user = {
      ...decoded,
      id: user.id,
      nickname: user.nickname,
      age_group: user.age_group,
      avatar: user.avatar,
      total_points: user.total_points,
      current_level: user.current_level,
      last_login_at: user.last_login_at,
      last_active_at: user.last_active_at,
      is_enabled: user.is_enabled,
    };

    next();
  } catch (error) {
    console.error("Protect middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
