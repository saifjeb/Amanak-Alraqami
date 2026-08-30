import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MEDIA_DIRECTORY = path.join(
  __dirname,
  "../../uploads/media",
);

export async function ensureMediaDirectory() {
  await fs.mkdir(MEDIA_DIRECTORY, {
    recursive: true,
  });
}

export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  // JPEG
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return {
      mimeType: "image/jpeg",
      extension: ".jpg",
    };
  }

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      mimeType: "image/png",
      extension: ".png",
    };
  }

  // WEBP
  const riff = buffer
    .subarray(0, 4)
    .toString("ascii");

  const webp = buffer
    .subarray(8, 12)
    .toString("ascii");

  if (riff === "RIFF" && webp === "WEBP") {
    return {
      mimeType: "image/webp",
      extension: ".webp",
    };
  }

  return null;
}

export function generateStoredName(extension) {
  const randomName = crypto.randomBytes(24).toString("hex");

  return `${randomName}${extension}`;
}

export async function saveImageBuffer(
  buffer,
  storedName,
) {
  await ensureMediaDirectory();

  const filePath = path.join(
    MEDIA_DIRECTORY,
    storedName,
  );

  await fs.writeFile(filePath, buffer, {
    flag: "wx",
  });

  return filePath;
}

export async function deleteImageFile(storedName) {
  if (!storedName) {
    return;
  }

  const filePath = path.join(
    MEDIA_DIRECTORY,
    path.basename(storedName),
  );

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}