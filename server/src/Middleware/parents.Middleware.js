import jwt from "jsonwebtoken";
import { getParentById } from "../Model/parents.Models.js";

const isProd = process.env.NODE_ENV === "production";
const clearParentCookies = (res) => {
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
  res.clearCookie("parentAccessToken", options);
  res.clearCookie("parentRefreshToken", options);
};

export const protectParent = async (req, res, next) => {
  const token = req.cookies.parentAccessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.PARENT_JWT_SECRET);

    if (decoded.type !== "parent" || !decoded.id) {
      clearParentCookies(res);

      return res.status(403).json({
        success: false,
        message: "Parent access required",
      });
    }

    const parent = await getParentById(decoded.id);
    if (!parent) {
      clearParentCookies(res);
      return res.status(401).json({
        success: false,
        message: "Parent account not found",
      });
    }
    req.parent = {
      ...decoded,
      id: parent.id,
      email: parent.email,
    };
    next();
  } catch (error) {
    clearParentCookies(res);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired parent token",
    });
  }
};