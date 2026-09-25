import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import app from "../src/app.js";
import pool from "../src/config/db.js";
import { MEDIA_DIRECTORY } from "../src/Utils/media.Utils.js";

const ADMIN_EMAIL = "media.security.admin@example.com";
const ADMIN_PASSWORD = "MediaSecurityPassword123!";
let adminId;
let adminToken;
let validPng;

before(async () => {
  const dbCheck = await pool.query(`
      SELECT current_database()
        AS database_name;
    `);

  assert.equal(dbCheck.rows[0].database_name, "amanak_alraqami_test");
  await pool.query(`
    TRUNCATE TABLE
      media,
      admins
    RESTART IDENTITY
    CASCADE;
  `);

  await fs.rm(MEDIA_DIRECTORY, {
    recursive: true,
    force: true,
  });

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const adminResult = await pool.query(
    `
      INSERT INTO admins (
        name,
        email,
        hashed_password
      )
      VALUES ($1, $2, $3)
      RETURNING id;
      `,
    ["Media Security Admin", ADMIN_EMAIL, hashedPassword],
  );

  adminId = adminResult.rows[0].id;
  adminToken = jwt.sign(
    {
      id: adminId,
      email: ADMIN_EMAIL,
      type: "admin",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  validPng = await sharp({
    create: {
      width: 20,
      height: 20,
      channels: 4,
      background: {
        r: 255,
        g: 255,
        b: 255,
        alpha: 1,
      },
    },
  })
    .png()
    .toBuffer();
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE
      media,
      admins
    RESTART IDENTITY
    CASCADE;
  `);

  await fs.rm(MEDIA_DIRECTORY, {
    recursive: true,
    force: true,
  });

  await pool.end();
});

function adminRequest() {
  return request(app)
    .post("/api/admin/media/upload")
    .set("Cookie", `adminAccessToken=${adminToken}`);
}

test("unauthenticated user cannot upload media", async () => {
  const response = await request(app)
    .post("/api/admin/media/upload")
    .attach("image", validPng, "photo.png")
    .expect(401);

  assert.equal(response.body.success, false);
});

test("valid PNG image can be uploaded", async () => {
  const response = await adminRequest()
    .attach("image", validPng, "safe-image.png")
    .expect(201);

  assert.equal(response.body.success, true);
  assert.equal(response.body.media.mime_type, "image/png");
  assert.match(response.body.media.stored_name, /^[a-f0-9]{48}\.png$/);
  assert.ok(Number(response.body.media.file_size) > 0);
});

test("text disguised as PNG is rejected", async () => {
  const fakeImage = Buffer.from("This is not a real image");
  const response = await adminRequest()
    .attach("image", fakeImage, {
      filename: "fake.png",
      contentType: "image/png",
    })
    .expect(400);
  assert.equal(response.body.success, false);
});

test("corrupted PNG with valid signature is rejected", async () => {
  const corruptedPng = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from("corrupted-content"),
  ]);
  const response = await adminRequest()
    .attach("image", corruptedPng, {
      filename: "corrupted.png",
      contentType: "image/png",
    })
    .expect(400);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Invalid or corrupted image file");
});

test("SVG upload is rejected", async () => {
  const svg = Buffer.from(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
        >
          <rect
            width="10"
            height="10"
          />
        </svg>
      `);

  const response = await adminRequest()
    .attach("image", svg, {
      filename: "image.svg",
      contentType: "image/svg+xml",
    })
    .expect(400);

  assert.equal(response.body.success, false);
});

test("file larger than 5 MB is rejected", async () => {
  const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
  const response = await adminRequest()
    .attach("image", oversizedBuffer, {
      filename: "large.png",
      contentType: "image/png",
    })
    .expect(413);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Image must not exceed 5 MB");
});

test("multiple image files are rejected", async () => {
  const response = await adminRequest()
    .attach("image", validPng, "first.png")
    .attach("image", validPng, "second.png")
    .expect(400);
  assert.equal(response.body.success, false);
});

test("uploaded image is re-encoded and stored safely", async () => {
  const imageWithExtraData = Buffer.concat([
    validPng,
    Buffer.from("<script>alert(1)</script>"),
  ]);

  const response = await adminRequest()
    .attach("image", imageWithExtraData, {
      filename: "../../unsafe.png",
      contentType: "image/png",
    })
    .expect(201);

  const storedName = response.body.media.stored_name;
  assert.match(storedName, /^[a-f0-9]{48}\.png$/);
  assert.equal(storedName.includes(".."), false);
  assert.equal(storedName.includes("/"), false);
  assert.equal(storedName.includes("\\"), false);
  const storedPath = path.join(MEDIA_DIRECTORY, storedName);
  const storedBuffer = await fs.readFile(storedPath);
  assert.equal(storedBuffer.includes(Buffer.from("<script>")), false);
  const metadata = await sharp(storedBuffer).metadata();
  assert.equal(metadata.format, "png");
});

test("media must be trashed before permanent deletion", async () => {
  const uploadResponse = await adminRequest()
    .attach("image", validPng, "delete-test.png")
    .expect(201);

  const mediaId = uploadResponse.body.media.id;
  const response = await request(app)
    .delete(`/api/admin/trash/media/${mediaId}/permanent`)
    .set("Cookie", `adminAccessToken=${adminToken}`)
    .expect(409);

  assert.equal(response.body.success, false);
});

test("Admin can trash restore and permanently delete media", async () => {
  const uploadResponse = await adminRequest()
    .attach("image", validPng, "lifecycle.png")
    .expect(201);
  const mediaId = uploadResponse.body.media.id;
  const storedName = uploadResponse.body.media.stored_name;
  const storedPath = path.join(MEDIA_DIRECTORY, storedName);
  await fs.access(storedPath);
  await request(app)
    .delete(`/api/admin/media/${mediaId}`)
    .set("Cookie", `adminAccessToken=${adminToken}`)
    .expect(200);
  await request(app)
    .patch(`/api/admin/trash/media/${mediaId}/restore`)
    .set("Cookie", `adminAccessToken=${adminToken}`)
    .expect(200);
  await request(app)
    .delete(`/api/admin/media/${mediaId}`)
    .set("Cookie", `adminAccessToken=${adminToken}`)
    .expect(200);
  await request(app)
    .delete(`/api/admin/trash/media/${mediaId}/permanent`)
    .set("Cookie", `adminAccessToken=${adminToken}`)
    .expect(200);
  await assert.rejects(fs.access(storedPath));
  const dbResult = await pool.query(
    `
        SELECT id
        FROM media
        WHERE id = $1;
        `,
    [mediaId],
  );
  assert.equal(dbResult.rows.length, 0);
});