import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import app from "../src/app.js";
import pool from "../src/config/db.js";
import { hashToken } from "../src/Utils/Tokens.Utils.js";

const OLD_PARENT_PASSWORD = "OldParentPassword123!";

const NEW_PARENT_PASSWORD = "NewParentPassword456!";

const OLD_ADMIN_PASSWORD = "OldAdminPassword123!";

const NEW_ADMIN_PASSWORD = "NewAdminPassword456!";

let parentId;
let adminId;

async function createResetToken(accountType, accountId, minutesFromNow = 15) {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = hashToken(token);

  const expiresAt = new Date(Date.now() + minutesFromNow * 60 * 1000);

  await pool.query(
    `
    INSERT INTO password_reset_tokens (
      account_type,
      account_id,
      token_hash,
      expires_at
    )
    VALUES ($1, $2, $3, $4);
    `,
    [accountType, accountId, tokenHash, expiresAt],
  );

  return token;
}

before(async () => {
  const dbCheck = await pool.query(
    `
      SELECT current_database() AS database_name;
      `,
  );

  assert.equal(dbCheck.rows[0].database_name, "amanak_alraqami_test");

  await pool.query(
    `
    TRUNCATE TABLE
      password_reset_tokens,
      parents,
      admins
    RESTART IDENTITY
    CASCADE;
    `,
  );

  const parentPasswordHash = await bcrypt.hash(OLD_PARENT_PASSWORD, 10);

  const parentResult = await pool.query(
    `
      INSERT INTO parents (
        name,
        email,
        hashed_password
      )
      VALUES ($1, $2, $3)
      RETURNING id;
      `,
    [
      "Integration Test Parent",
      "integration.parent@example.com",
      parentPasswordHash,
    ],
  );

  parentId = parentResult.rows[0].id;

  const adminPasswordHash = await bcrypt.hash(OLD_ADMIN_PASSWORD, 10);

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
    [
      "Integration Test Admin",
      "integration.admin@example.com",
      adminPasswordHash,
    ],
  );

  adminId = adminResult.rows[0].id;
});

after(async () => {
  await pool.query(
    `
    TRUNCATE TABLE
      password_reset_tokens,
      parents,
      admins
    RESTART IDENTITY
    CASCADE;
    `,
  );

  await pool.end();
});

test("parent can reset password with valid token", async () => {
  const token = await createResetToken("parent", parentId);

  const response = await request(app)
    .post("/api/parent/reset-password")
    .send({
      token,
      password: NEW_PARENT_PASSWORD,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  const result = await pool.query(
    `
        SELECT
          hashed_password,
          refresh_token
        FROM parents
        WHERE id = $1;
        `,
    [parentId],
  );

  const parent = result.rows[0];

  assert.equal(
    await bcrypt.compare(NEW_PARENT_PASSWORD, parent.hashed_password),
    true,
  );

  assert.equal(
    await bcrypt.compare(OLD_PARENT_PASSWORD, parent.hashed_password),
    false,
  );

  assert.equal(parent.refresh_token, null);
});

test("used parent reset token cannot be reused", async () => {
  const token = await createResetToken("parent", parentId);

  await request(app)
    .post("/api/parent/reset-password")
    .send({
      token,
      password: NEW_PARENT_PASSWORD,
    })
    .expect(200);

  const response = await request(app)
    .post("/api/parent/reset-password")
    .send({
      token,
      password: "AnotherPassword789!",
    })
    .expect(400);

  assert.equal(response.body.success, false);

  assert.equal(
    response.body.message,
    "Invalid or expired password reset link.",
  );
});

test("expired parent reset token is rejected", async () => {
  const token = await createResetToken("parent", parentId, -15);

  const response = await request(app)
    .post("/api/parent/reset-password")
    .send({
      token,
      password: "ExpiredPassword123!",
    })
    .expect(400);

  assert.equal(response.body.success, false);

  assert.equal(
    response.body.message,
    "Invalid or expired password reset link.",
  );
});

test("admin can reset password with valid token", async () => {
  const token = await createResetToken("admin", adminId);

  const response = await request(app)
    .post("/api/admin/reset-password")
    .send({
      token,
      password: NEW_ADMIN_PASSWORD,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  const result = await pool.query(
    `
        SELECT hashed_password
        FROM admins
        WHERE id = $1;
        `,
    [adminId],
  );

  const admin = result.rows[0];

  assert.equal(
    await bcrypt.compare(NEW_ADMIN_PASSWORD, admin.hashed_password),
    true,
  );

  assert.equal(
    await bcrypt.compare(OLD_ADMIN_PASSWORD, admin.hashed_password),
    false,
  );
});

test("used admin reset token cannot be reused", async () => {
  const token = await createResetToken("admin", adminId);

  await request(app)
    .post("/api/admin/reset-password")
    .send({
      token,
      password: NEW_ADMIN_PASSWORD,
    })
    .expect(200);

  const response = await request(app)
    .post("/api/admin/reset-password")
    .send({
      token,
      password: "AnotherAdminPassword789!",
    })
    .expect(400);

  assert.equal(response.body.success, false);

  assert.equal(
    response.body.message,
    "Invalid or expired password reset link.",
  );
});
