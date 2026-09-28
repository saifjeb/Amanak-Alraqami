import test, {
  before,
  after,
} from "node:test";

import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import pool from "../src/config/db.js";

let adminToken;
let childToken;
let adventureId;
let imageMediaId;
let videoMediaId;
let trashedVideoMediaId;

before(async () => {
  const dbCheck = await pool.query(`
    SELECT current_database()
      AS database_name;
  `);

  assert.equal(
    dbCheck.rows[0].database_name,
    "amanak_alraqami_test",
  );

  await pool.query(`
    TRUNCATE TABLE
      adventures,
      media,
      admins,
      users
    RESTART IDENTITY
    CASCADE;
  `);

  const adminResult =
    await pool.query(
      `
      INSERT INTO admins (
        name,
        email,
        hashed_password
      )
      VALUES ($1, $2, $3)
      RETURNING id;
      `,
      [
        "Adventure Media Test Admin",
        "adventure.media@example.com",
        "test-password-hash",
      ],
    );

  const adminId =
    adminResult.rows[0].id;

  adminToken =
    jwt.sign(
      {
        id: adminId,
        email:
          "adventure.media@example.com",
        type: "admin",
      },
      process.env.ADMIN_JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

  const childResult =
    await pool.query(
      `
      INSERT INTO users (
        nickname,
        hashed_password,
        age_group,
        avatar
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id;
      `,
      [
        "AdventureVideoChild",
        "test-password-hash",
        "8-10",
        "avatar1",
      ],
    );

  const childId =
    childResult.rows[0].id;

  childToken =
    jwt.sign(
      {
        id: childId,
        nickname: "AdventureVideoChild",
        type: "child",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

  const adventureResult =
    await pool.query(
      `
      INSERT INTO adventures (
        title_ar,
        title_en,
        description_ar,
        description_en,
        icon,
        badge_name,
        completion_points,
        display_order,
        is_active
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        TRUE
      )
      RETURNING id;
      `,
      [
        "مغامرة اختبار الفيديو",
        "Adventure Video Test",
        "وصف تجريبي",
        "Test description",
        "lock",
        "Video Tester",
        50,
        1,
      ],
    );

  adventureId =
    adventureResult.rows[0].id;

  const imageResult =
    await pool.query(
      `
      INSERT INTO media (
        original_name,
        stored_name,
        mime_type,
        file_size,
        file_path,
        uploaded_by_admin_id
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING id;
      `,
      [
        "adventure-image.png",
        `${"a".repeat(48)}.png`,
        "image/png",
        1024,
        `uploads/media/${"a".repeat(48)}.png`,
        adminId,
      ],
    );

  imageMediaId =
    imageResult.rows[0].id;

  const videoResult =
    await pool.query(
      `
      INSERT INTO media (
        original_name,
        stored_name,
        mime_type,
        file_size,
        file_path,
        uploaded_by_admin_id
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING id;
      `,
      [
        "adventure-video.mp4",
        `${"b".repeat(48)}.mp4`,
        "video/mp4",
        2048,
        `uploads/media/${"b".repeat(48)}.mp4`,
        adminId,
      ],
    );

  videoMediaId =
    videoResult.rows[0].id;

  const trashedVideoResult =
    await pool.query(
      `
      INSERT INTO media (
        original_name,
        stored_name,
        mime_type,
        file_size,
        file_path,
        uploaded_by_admin_id,
        deleted_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        CURRENT_TIMESTAMP
      )
      RETURNING id;
      `,
      [
        "trashed-video.mp4",
        `${"c".repeat(48)}.mp4`,
        "video/mp4",
        2048,
        `uploads/media/${"c".repeat(48)}.mp4`,
        adminId,
      ],
    );

  trashedVideoMediaId =
    trashedVideoResult.rows[0].id;
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE
      adventures,
      media,
      admins,
      users
    RESTART IDENTITY
    CASCADE;
  `);

  await pool.end();
});

function adminPatch(path) {
  return request(app)
    .patch(path)
    .set(
      "Cookie",
      `adminAccessToken=${adminToken}`,
    );
}

test(
  "adventure video route rejects unauthenticated request",
  async () => {
    await request(app)
      .patch(
        `/api/admin/adventures/${adventureId}/video`,
      )
      .send({
        media_id: videoMediaId,
      })
      .expect(401);
  },
);

test(
  "PNG image can be assigned to adventure image slot",
  async () => {
    const response =
      await adminPatch(
        `/api/admin/adventures/${adventureId}/image`,
      )
        .send({
          media_id: imageMediaId,
        })
        .expect(200);

    assert.equal(
      response.body.success,
      true,
    );

    assert.equal(
      response.body.adventure.image_media_id,
      imageMediaId,
    );
  },
);

test(
  "MP4 cannot be assigned to adventure image slot",
  async () => {
    const response =
      await adminPatch(
        `/api/admin/adventures/${adventureId}/image`,
      )
        .send({
          media_id: videoMediaId,
        })
        .expect(400);

    assert.equal(
      response.body.success,
      false,
    );

    assert.equal(
      response.body.message,
      "Selected media is not a supported image",
    );
  },
);

test(
  "MP4 can be assigned to adventure video slot",
  async () => {
    const response =
      await adminPatch(
        `/api/admin/adventures/${adventureId}/video`,
      )
        .send({
          media_id: videoMediaId,
        })
        .expect(200);

    assert.equal(
      response.body.success,
      true,
    );

    assert.equal(
      response.body.adventure.video_media_id,
      videoMediaId,
    );

    assert.equal(
      response.body.adventure.video_url,
      `/api/media/${videoMediaId}`,
    );
  },
);

test(
  "PNG cannot be assigned to adventure video slot",
  async () => {
    const response =
      await adminPatch(
        `/api/admin/adventures/${adventureId}/video`,
      )
        .send({
          media_id: imageMediaId,
        })
        .expect(400);

    assert.equal(
      response.body.success,
      false,
    );

    assert.equal(
      response.body.message,
      "Selected media is not an MP4 video",
    );
  },
);

test(
  "trashed MP4 cannot be assigned to adventure video slot",
  async () => {
    const response =
      await adminPatch(
        `/api/admin/adventures/${adventureId}/video`,
      )
        .send({
          media_id:
            trashedVideoMediaId,
        })
        .expect(409);

    assert.equal(
      response.body.success,
      false,
    );

    assert.equal(
      response.body.message,
      "Cannot attach media that is in trash",
    );
  },
);

test(
  "public adventure response exposes assigned video",
  async () => {
    await adminPatch(
      `/api/admin/adventures/${adventureId}/video`,
    )
      .send({
        media_id: videoMediaId,
      })
      .expect(200);

    const response =
      await request(app)
        .get(
          `/api/adventures/${adventureId}`,
        )
        .set(
          "Cookie",
          `accessToken=${childToken}`,
        )
        .expect(200);

    assert.equal(
      response.body.adventure.video_media_id,
      videoMediaId,
    );

    assert.equal(
      response.body.adventure.video_url,
      `/api/media/${videoMediaId}`,
    );
  },
);
