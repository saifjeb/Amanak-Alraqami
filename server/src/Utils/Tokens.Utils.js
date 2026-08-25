import jwt from "jsonwebtoken";
import crypto from "node:crypto";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      nickname: user.nickname,
      type: "child",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );
};
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      type: "child",
    },
    process.env.REFRESH_SECRET,
    {
      expiresIn: "30d",
    }
  );
};
export const generateParentAccessToken = (parent) => {
  return jwt.sign(
    {
      id: parent.id,
      email: parent.email,
      type: "parent",
    },
    process.env.PARENT_JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

export const generateParentRefreshToken = (parent) => {
  return jwt.sign(
    {
      id: parent.id,
      type: "parent",
    },
    process.env.PARENT_REFRESH_SECRET,
    {
      expiresIn: "30d",
    }
  );
};
export const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};