import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { getAdminByEmail, getAdminById } from "../Model/admin.Model.js";

export const adminLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await getAdminByEmail(email);

    if (!admin) {
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
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
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

    res.cookie("adminAccessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",

      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const adminMeController = async (req, res) => {
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
      admin,
    });
  } catch (error) {
    console.error("Admin me error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const adminLogoutController = async (req, res) => {
  res.clearCookie("adminAccessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Admin logged out successfully",
  });
};
