import test from "node:test";
import assert from "node:assert/strict";

const ENV_KEYS = [
  "MEDIA_STORAGE",
  "S3_BUCKET",
  "S3_REGION",
  "S3_ENDPOINT",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_SESSION_TOKEN",
  "S3_FORCE_PATH_STYLE",
];

let importCounter = 0;

function saveEnvironment() {
  const snapshot = {};

  for (const key of ENV_KEYS) {
    snapshot[key] = process.env[key];
  }

  return snapshot;
}

function restoreEnvironment(snapshot) {
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
}

function clearStorageEnvironment() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

async function loadStorageModule() {
  importCounter += 1;

  return import(
    `../src/Storage/mediaStorage.js?storage-test=${importCounter}`
  );
}

const VALID_STORED_NAME =
  `${"a".repeat(48)}.png`;

test("media storage defaults to local", async () => {
  const snapshot = saveEnvironment();

  try {
    clearStorageEnvironment();

    const storage =
      await loadStorageModule();

    assert.equal(
      storage.getMediaStorageDriver(),
      "local",
    );

    assert.equal(
      storage.getMediaStoragePath(
        VALID_STORED_NAME,
      ),
      `uploads/media/${VALID_STORED_NAME}`,
    );
  } finally {
    restoreEnvironment(snapshot);
  }
});

test("unsupported media storage driver is rejected", async () => {
  const snapshot = saveEnvironment();

  try {
    clearStorageEnvironment();
    process.env.MEDIA_STORAGE =
      "unsupported";

    const storage =
      await loadStorageModule();

    assert.throws(
      () =>
        storage.getMediaStorageDriver(),
      /Unsupported media storage driver/,
    );
  } finally {
    restoreEnvironment(snapshot);
  }
});

test("invalid stored media filename is rejected", async () => {
  const snapshot = saveEnvironment();

  try {
    clearStorageEnvironment();

    const storage =
      await loadStorageModule();

    assert.throws(
      () =>
        storage.getMediaStoragePath(
          "../unsafe.png",
        ),
      /Invalid stored media filename/,
    );
  } finally {
    restoreEnvironment(snapshot);
  }
});

test("S3 storage requires a bucket", async () => {
  const snapshot = saveEnvironment();

  try {
    clearStorageEnvironment();

    process.env.MEDIA_STORAGE = "s3";
    process.env.S3_REGION = "us-east-1";

    const storage =
      await loadStorageModule();

    await assert.rejects(
      () =>
        storage.saveMediaObject(
          Buffer.from("test"),
          VALID_STORED_NAME,
        ),
      /S3_BUCKET is required/,
    );
  } finally {
    restoreEnvironment(snapshot);
  }
});

test("S3 storage requires a region", async () => {
  const snapshot = saveEnvironment();

  try {
    clearStorageEnvironment();

    process.env.MEDIA_STORAGE = "s3";
    process.env.S3_BUCKET =
      "test-bucket";

    const storage =
      await loadStorageModule();

    await assert.rejects(
      () =>
        storage.saveMediaObject(
          Buffer.from("test"),
          VALID_STORED_NAME,
        ),
      /S3_REGION is required/,
    );
  } finally {
    restoreEnvironment(snapshot);
  }
});

test("S3 access key and secret key must be configured together", async () => {
  const snapshot = saveEnvironment();

  try {
    clearStorageEnvironment();

    process.env.MEDIA_STORAGE = "s3";
    process.env.S3_BUCKET =
      "test-bucket";
    process.env.S3_REGION =
      "us-east-1";
    process.env.S3_ACCESS_KEY_ID =
      "test-access-key";

    const storage =
      await loadStorageModule();

    await assert.rejects(
      () =>
        storage.saveMediaObject(
          Buffer.from("test"),
          VALID_STORED_NAME,
        ),
      /S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be provided together/,
    );
  } finally {
    restoreEnvironment(snapshot);
  }
});
