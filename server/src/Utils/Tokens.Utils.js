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

export const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashToken(token),
  };
};

export const generateEmailVerificationCode = () => {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
};

export const hashEmailVerificationCode = (
  parentId,
  code
) => {
  const secret =
    process.env.EMAIL_VERIFICATION_SECRET;

  if (!secret) {
    throw new Error(
      "EMAIL_VERIFICATION_SECRET is not configured"
    );
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`${parentId}:${code}`)
    .digest("hex");
};