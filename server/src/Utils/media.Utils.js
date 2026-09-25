import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const MEDIA_DIRECTORY = path.resolve(__dirname, "../../uploads/media");
const ALLOWED_EXTENSIONS = new Set([".jpg", ".png", ".webp"]);
const STORED_NAME_PATTERN = /^[a-f0-9]{48}\.(jpg|png|webp)$/;
const MAX_INPUT_PIXELS = 25_000_000;

export async function ensureMediaDirectory() {
  await fs.mkdir(MEDIA_DIRECTORY, {
    recursive: true,
  });
}

export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return {
      mimeType: "image/jpeg",
      extension: ".jpg",
      format: "jpeg",
    };
  }

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
      format: "png",
    };
  }

  const riff = buffer.subarray(0, 4).toString("ascii");
  const webp = buffer.subarray(8, 12).toString("ascii");
  if (riff === "RIFF" && webp === "WEBP") {
    return {
      mimeType: "image/webp",
      extension: ".webp",
      format: "webp",
    };
  }
  return null;
}

export async function sanitizeImageBuffer(buffer) {
  const detectedType = detectImageType(buffer);
  if (!detectedType) {
    throw new Error("Invalid image file");
  }

  let metadata;
  try {
    metadata = await sharp(buffer, {
      failOn: "error",
      limitInputPixels: MAX_INPUT_PIXELS,
      animated: false,
    }).metadata();
  } catch {
    throw new Error("Invalid or corrupted image file");
  }

  if (
    metadata.format !== detectedType.format ||
    !metadata.width ||
    !metadata.height
  ) {
    throw new Error("Invalid image file");
  }

  if (metadata.pages && metadata.pages > 1) {
    throw new Error("Animated images are not allowed");
  }

  if (metadata.width * metadata.height > MAX_INPUT_PIXELS) {
    throw new Error("Image dimensions are too large");
  }

  let processor = sharp(buffer, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
    animated: false,
  }).rotate();

  if (detectedType.format === "jpeg") {
    processor = processor.jpeg({
      quality: 90,
      progressive: true,
    });
  }

  if (detectedType.format === "png") {
    processor = processor.png({
      compressionLevel: 9,
    });
  }

  if (detectedType.format === "webp") {
    processor = processor.webp({
      quality: 90,
    });
  }

  let sanitizedBuffer;
  try {
    sanitizedBuffer = await processor.toBuffer();
  } catch {
    throw new Error("Invalid or corrupted image file");
  }
  if (!sanitizedBuffer || sanitizedBuffer.length === 0) {
    throw new Error("Invalid image file");
  }

  return {
    buffer: sanitizedBuffer,
    mimeType: detectedType.mimeType,
    extension: detectedType.extension,
  };
}
export function generateStoredName(extension) {
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Unsupported image extension");
  }
  const randomName = crypto.randomBytes(24).toString("hex");
  return `${randomName}${extension}`;
}

function validateStoredName(storedName) {
  if (typeof storedName !== "string" || !STORED_NAME_PATTERN.test(storedName)) {
    throw new Error("Invalid stored media filename");
  }

  return storedName;
}

function getSafeMediaPath(storedName) {
  const safeName = validateStoredName(storedName);
  const filePath = path.resolve(MEDIA_DIRECTORY, safeName);
  const mediaRoot = `${MEDIA_DIRECTORY}${path.sep}`;

  if (!filePath.startsWith(mediaRoot)) {
    throw new Error("Invalid media file path");
  }

  return filePath;
}

export async function saveImageBuffer(buffer, storedName) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("Invalid image buffer");
  }

  const filePath = getSafeMediaPath(storedName);
  await ensureMediaDirectory();
  await fs.writeFile(filePath, buffer, {
    flag: "wx",
  });

  return filePath;
}

export async function deleteImageFile(storedName) {
  if (!storedName) {
    return;
  }

  const filePath = getSafeMediaPath(storedName);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}
