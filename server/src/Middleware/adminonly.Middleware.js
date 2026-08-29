import jwt from "jsonwebtoken";
import { getAdminById } from "../Model/admin.Model.js";

const isProd = process.env.NODE_ENV === "production";

const clearAdminCookie = (res) => {
  res.clearCookie("adminAccessToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });
};

export const protectAdmin = async (req, res, next) => {
  const token = req.cookies.adminAccessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Admin not authenticated",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (decoded.type !== "admin" || !decoded.id) {
      clearAdminCookie(res);

      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const admin = await getAdminById(decoded.id);

    if (!admin) {
      clearAdminCookie(res);

      return res.status(401).json({
        success: false,
        message: "Admin account not found",
      });
    }

    req.admin = {
      ...decoded,
      id: admin.id,
      email: admin.email,
    };

    next();
  } catch (error) {
    clearAdminCookie(res);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token",
    });
  }
};
