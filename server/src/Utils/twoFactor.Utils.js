import crypto from "node:crypto";

import { generateSecret, generateURI, verify } from "otplib";

const ISSUER = "Amanak Alraqami";
const TOTP_ALGORITHM = "sha1";
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_TOLERANCE_SECONDS = 30;

function getEncryptionKey() {
  const encodedKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;

  if (!encodedKey) {
    throw new Error("TWO_FACTOR_ENCRYPTION_KEY is not configured");
  }

  const key = Buffer.from(encodedKey, "base64");

  if (key.length !== 32) {
    throw new Error("TWO_FACTOR_ENCRYPTION_KEY must be a 32-byte Base64 key");
  }

  return key;
}

function getRecoveryCodeSecret() {
  const encodedSecret = process.env.TWO_FACTOR_RECOVERY_SECRET;

  if (!encodedSecret) {
    throw new Error("TWO_FACTOR_RECOVERY_SECRET is not configured");
  }

  const secret = Buffer.from(encodedSecret, "base64");

  if (secret.length !== 32) {
    throw new Error("TWO_FACTOR_RECOVERY_SECRET must be a 32-byte Base64 key");
  }

  return secret;
}

function normalizeSetupIdentity({ email, accountType }) {
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    throw new Error("Email is required for 2FA setup");
  }

  if (accountType !== "parent" && accountType !== "admin") {
    throw new Error("Invalid 2FA account type");
  }

  const accountLabel =
    accountType === "admin"
      ? `Admin - ${normalizedEmail}`
      : `Parent - ${normalizedEmail}`;

  return {
    normalizedEmail,
    accountLabel,
  };
}

function createOtpAuthUrl({ secret, email, accountType }) {
  const { accountLabel } = normalizeSetupIdentity({
    email,
    accountType,
  });

  return generateURI({
    issuer: ISSUER,
    label: accountLabel,
    secret,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
  });
}

export function encryptTwoFactorSecret(secret) {
  if (typeof secret !== "string" || !secret) {
    throw new Error("2FA secret is invalid");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptTwoFactorSecret(encryptedValue) {
  if (typeof encryptedValue !== "string" || !encryptedValue) {
    throw new Error("Encrypted 2FA secret is invalid");
  }

  const parts = encryptedValue.split(".");

  if (parts.length !== 3) {
    throw new Error("Encrypted 2FA secret format is invalid");
  }

  const [ivValue, authTagValue, encryptedSecretValue] = parts;
  const key = getEncryptionKey();

  const iv = Buffer.from(ivValue, "base64");
  const authTag = Buffer.from(authTagValue, "base64");
  const encryptedSecret = Buffer.from(encryptedSecretValue, "base64");

  if (
    iv.length !== 12 ||
    authTag.length !== 16 ||
    encryptedSecret.length === 0
  ) {
    throw new Error("Encrypted 2FA secret format is invalid");
  }

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedSecret),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function createTwoFactorSetup({ email, accountType }) {
  const secret = generateSecret();

  return {
    secret,
    encryptedSecret: encryptTwoFactorSecret(secret),
    otpauthUrl: createOtpAuthUrl({
      secret,
      email,
      accountType,
    }),
  };
}

export function resumeTwoFactorSetup({
  email,
  accountType,
  encryptedSecret,
}) {
  const secret = decryptTwoFactorSecret(encryptedSecret);

  return {
    secret,
    encryptedSecret,
    otpauthUrl: createOtpAuthUrl({
      secret,
      email,
      accountType,
    }),
  };
}

export async function verifyTwoFactorToken({
  encryptedSecret,
  token,
  lastUsedTimeStep = null,
}) {
  const normalizedToken =
    typeof token === "string" ? token.trim() : "";

  if (!/^\d{6}$/.test(normalizedToken)) {
    return {
      valid: false,
      timeStep: null,
    };
  }

  const secret = decryptTwoFactorSecret(encryptedSecret);

  const options = {
    secret,
    token: normalizedToken,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    epochTolerance: TOTP_TOLERANCE_SECONDS,
  };

  if (
    lastUsedTimeStep !== null &&
    lastUsedTimeStep !== undefined
  ) {
    const parsedTimeStep = Number(lastUsedTimeStep);

    if (
      Number.isSafeInteger(parsedTimeStep) &&
      parsedTimeStep >= 0
    ) {
      options.afterTimeStep = parsedTimeStep;
    }
  }

  const result = await verify(options);

  if (!result || result.valid !== true) {
    return {
      valid: false,
      timeStep: null,
    };
  }

  const timeStep = Number(result.timeStep);

  if (!Number.isSafeInteger(timeStep) || timeStep < 0) {
    return {
      valid: false,
      timeStep: null,
    };
  }

  return {
    valid: true,
    timeStep,
  };
}

export function normalizeRecoveryCode(code) {
  if (typeof code !== "string") {
    return "";
  }

  return code.replace(/[\s-]/g, "").toUpperCase();
}

export function generateTwoFactorRecoveryCodes(count = 8) {
  if (!Number.isInteger(count) || count < 1 || count > 20) {
    throw new Error("Invalid recovery code count");
  }

  return Array.from({ length: count }, () => {
    const raw = crypto.randomBytes(12).toString("hex").toUpperCase();

    return raw.match(/.{1,6}/g).join("-");
  });
}

export function hashTwoFactorRecoveryCode({
  accountType,
  accountId,
  code,
}) {
  if (accountType !== "parent" && accountType !== "admin") {
    throw new Error("Invalid 2FA account type");
  }

  if (accountId === null || accountId === undefined) {
    throw new Error("Account ID is required");
  }

  const normalizedCode = normalizeRecoveryCode(code);

  if (!/^[A-F0-9]{24}$/.test(normalizedCode)) {
    throw new Error("Invalid recovery code format");
  }

  return crypto
    .createHmac("sha256", getRecoveryCodeSecret())
    .update(`${accountType}:${accountId}:${normalizedCode}`)
    .digest("hex");
}
