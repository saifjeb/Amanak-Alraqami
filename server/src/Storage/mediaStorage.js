import fs from "node:fs/promises";
import path from "node:path";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import {
  MEDIA_DIRECTORY,
  saveImageBuffer,
  deleteImageFile,
} from "../Utils/media.Utils.js";

const STORAGE_DRIVER = (
  process.env.MEDIA_STORAGE || "local"
)
  .trim()
  .toLowerCase();

const STORED_NAME_PATTERN =
  /^[a-f0-9]{48}\.(jpg|png|webp|mp4)$/;

const VALID_STORAGE_DRIVERS =
  new Set(["local", "s3"]);

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

let cachedS3Client = null;

function ensureValidStoredName(storedName) {
  if (
    typeof storedName !== "string" ||
    !STORED_NAME_PATTERN.test(storedName)
  ) {
    throw new Error(
      "Invalid stored media filename",
    );
  }

  return storedName;
}

function ensureSupportedDriver() {
  if (
    !VALID_STORAGE_DRIVERS.has(
      STORAGE_DRIVER,
    )
  ) {
    throw new Error(
      `Unsupported media storage driver: ${STORAGE_DRIVER}`,
    );
  }
}

function getLocalPath(storedName) {
  const safeName =
    ensureValidStoredName(storedName);

  const filePath = path.resolve(
    MEDIA_DIRECTORY,
    safeName,
  );

  const mediaRoot =
    `${MEDIA_DIRECTORY}${path.sep}`;

  if (!filePath.startsWith(mediaRoot)) {
    throw new Error(
      "Invalid media file path",
    );
  }

  return filePath;
}

function getS3ObjectKey(storedName) {
  const safeName =
    ensureValidStoredName(storedName);

  return `media/${safeName}`;
}

function parseBoolean(value) {
  if (!value) {
    return false;
  }

  return ["true", "1", "yes"].includes(
    value.trim().toLowerCase(),
  );
}

function getS3Configuration() {
  const bucket =
    (process.env.S3_BUCKET || "").trim();

  const region =
    (process.env.S3_REGION || "").trim();

  const endpoint =
    (process.env.S3_ENDPOINT || "").trim();

  const accessKeyId =
    (
      process.env.S3_ACCESS_KEY_ID ||
      ""
    ).trim();

  const secretAccessKey =
    (
      process.env.S3_SECRET_ACCESS_KEY ||
      ""
    ).trim();

  const sessionToken =
    (
      process.env.S3_SESSION_TOKEN ||
      ""
    ).trim();

  const forcePathStyle =
    parseBoolean(
      process.env.S3_FORCE_PATH_STYLE,
    );

  if (!bucket) {
    throw new Error(
      "S3_BUCKET is required when MEDIA_STORAGE=s3",
    );
  }

  if (!region) {
    throw new Error(
      "S3_REGION is required when MEDIA_STORAGE=s3",
    );
  }

  if (
    Boolean(accessKeyId) !==
    Boolean(secretAccessKey)
  ) {
    throw new Error(
      "S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be provided together",
    );
  }

  let credentials;

  if (
    accessKeyId &&
    secretAccessKey
  ) {
    credentials = {
      accessKeyId,
      secretAccessKey,
    };

    if (sessionToken) {
      credentials.sessionToken =
        sessionToken;
    }
  }

  return {
    bucket,
    region,
    endpoint:
      endpoint || undefined,
    credentials,
    forcePathStyle,
  };
}

function getS3Client() {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const config =
    getS3Configuration();

  cachedS3Client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: config.credentials,
    forcePathStyle:
      config.forcePathStyle,
  });

  return cachedS3Client;
}

function getContentType(storedName) {
  const extension =
    path.extname(storedName);

  const contentType =
    CONTENT_TYPES[extension];

  if (!contentType) {
    throw new Error(
      "Unsupported media content type",
    );
  }

  return contentType;
}

async function streamToBuffer(body) {
  if (!body) {
    return null;
  }

  if (
    typeof body.transformToByteArray ===
    "function"
  ) {
    const bytes =
      await body.transformToByteArray();

    return Buffer.from(bytes);
  }

  const chunks = [];

  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function isS3NotFoundError(error) {
  return (
    error?.name === "NoSuchKey" ||
    error?.name === "NotFound" ||
    error?.$metadata?.httpStatusCode ===
      404
  );
}

async function saveS3Object(
  buffer,
  storedName,
) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      "Invalid image buffer",
    );
  }

  const config =
    getS3Configuration();

  const client =
    getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: getS3ObjectKey(
        storedName,
      ),
      Body: buffer,
      ContentType:
        getContentType(storedName),
    }),
  );
}

async function readS3Object(
  storedName,
  range = null,
) {
  const config =
    getS3Configuration();

  const client =
    getS3Client();

  try {
    const command = {
      Bucket: config.bucket,
      Key: getS3ObjectKey(
        storedName,
      ),
    };

    if (range) {
      command.Range = range;
    }

    const result =
      await client.send(
        new GetObjectCommand(command),
      );

    const buffer =
      await streamToBuffer(
        result.Body,
      );

    return {
      buffer,
      contentRange:
        result.ContentRange || null,
      contentLength:
        result.ContentLength ?? buffer?.length ?? 0,
    };
  } catch (error) {
    if (isS3NotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function deleteS3Object(
  storedName,
) {
  const config =
    getS3Configuration();

  const client =
    getS3Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: getS3ObjectKey(
        storedName,
      ),
    }),
  );
}

export function getMediaStorageDriver() {
  ensureSupportedDriver();

  return STORAGE_DRIVER;
}

export function getMediaStoragePath(
  storedName,
) {
  ensureValidStoredName(storedName);

  return `uploads/media/${storedName}`;
}

export async function saveMediaObject(
  buffer,
  storedName,
) {
  ensureSupportedDriver();

  if (STORAGE_DRIVER === "local") {
    return saveImageBuffer(
      buffer,
      storedName,
    );
  }

  return saveS3Object(
    buffer,
    storedName,
  );
}

export async function readMediaObject(
  storedName,
) {
  ensureSupportedDriver();

  if (STORAGE_DRIVER === "local") {
    const filePath =
      getLocalPath(storedName);

    try {
      return await fs.readFile(
        filePath,
      );
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }

      throw error;
    }
  }

  const result =
    await readS3Object(storedName);

  return result?.buffer || null;
}

export async function readMediaRange(
  storedName,
  start,
  end,
) {
  ensureSupportedDriver();

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start
  ) {
    throw new Error("Invalid media byte range");
  }

  if (STORAGE_DRIVER === "local") {
    const filePath =
      getLocalPath(storedName);

    try {
      const handle =
        await fs.open(filePath, "r");

      try {
        const length =
          end - start + 1;

        const buffer =
          Buffer.alloc(length);

        const { bytesRead } =
          await handle.read(
            buffer,
            0,
            length,
            start,
          );

        return {
          buffer:
            bytesRead === length
              ? buffer
              : buffer.subarray(0, bytesRead),
          contentLength: bytesRead,
        };
      } finally {
        await handle.close();
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }

      throw error;
    }
  }

  return readS3Object(
    storedName,
    `bytes=${start}-${end}`,
  );
}

export async function deleteMediaObject(
  storedName,
) {
  ensureSupportedDriver();

  if (STORAGE_DRIVER === "local") {
    return deleteImageFile(
      storedName,
    );
  }

  return deleteS3Object(
    storedName,
  );
}
