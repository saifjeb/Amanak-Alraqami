import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { register } from "../model/auth.Model.js";
import { registerValidation } from "../Validation/auth.Validation.js";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

export const registerController = async (req, res) => {
  try {
    const { error, value } = registerValidation.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((d) => d.message),
      });
    }

    const { nickname, password,confirmPassword , age_group, avatar } = value;

    const hashed_password = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await register(nickname, hashed_password, age_group, avatar);

    const token = jwt.sign(
      { id: user.id, nickname: user.nickname },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Nickname already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};