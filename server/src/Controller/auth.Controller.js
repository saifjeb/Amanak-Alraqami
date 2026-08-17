import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { register } from "../Model/auth.Model.js";
import { getUserByNickname } from "../Model/user.Model.js";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
};

function sendToken(res, user) {
  const token = jwt.sign(
    { id: user.id, nickname: user.nickname },
    process.env.JWT_SECRET,
    { expiresIn: EXPIRES_IN }
  );

  res.cookie("token", token, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
}

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

export async function registerController(req, res) {
  try {
    const { nickname, password, age_group, avatar } = req.body;

    const hashed_password = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await register(nickname, hashed_password, age_group, avatar);

    sendToken(res, user);

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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.hashed_password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendToken(res, user);

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