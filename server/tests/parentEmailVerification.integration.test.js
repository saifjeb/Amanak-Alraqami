import test, { before, beforeEach, after } from "node:test";

import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app.js";
import pool from "../src/config/db.js";

import {
  generateParentRefreshToken,
  hashEmailVerificationCode,
  hashToken,
} from "../src/Utils/Tokens.Utils.js";

import {
  deleteActiveParentVerificationCodes,
  createParentVerificationCode,
} from "../src/Model/parentEmailVerification.Model.js";

const PARENT_EMAIL = "verification.parent@example.com";

const PARENT_PASSWORD = "VerificationParent123!";

let parentId;

async function createVerificationCode(code, minutesFromNow = 10) {
  const codeDigest = hashEmailVerificationCode(parentId, code);

  const expiresAt = new Date(Date.now() + minutesFromNow * 60 * 1000);

  await pool.query(
    `
    INSERT INTO parent_email_verification_codes (
      parent_id,
      code_hash,
      expires_at
    )
    VALUES ($1, $2, $3);
    `,
    [parentId, codeDigest, expiresAt],
  );

  return codeDigest;
}

before(async () => {
  const dbCheck = await pool.query(
    `
      SELECT
        current_database()
        AS database_name;
      `,
  );

  assert.equal(dbCheck.rows[0].database_name, "amanak_alraqami_test");

  await pool.query(
    `
    TRUNCATE TABLE
      parent_email_verification_codes,
      parents
    RESTART IDENTITY
    CASCADE;
    `,
  );

  const hashedPassword = await bcrypt.hash(PARENT_PASSWORD, 10);

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
    ["Email Verification Test Parent", PARENT_EMAIL, hashedPassword],
  );

  parentId = parentResult.rows[0].id;
});

beforeEach(async () => {
  await pool.query(
    `
    DELETE FROM
      parent_email_verification_codes
    WHERE parent_id = $1;
    `,
    [parentId],
  );

  await pool.query(
    `
    UPDATE parents
    SET
      email_verified_at = NULL,
      refresh_token = NULL
    WHERE id = $1;
    `,
    [parentId],
  );
});

after(async () => {
  await pool.query(
    `
    TRUNCATE TABLE
      parent_email_verification_codes,
      parents
    RESTART IDENTITY
    CASCADE;
    `,
  );

  await pool.end();
});

test("unverified parent cannot login", async () => {
  const response = await request(app)
    .post("/api/parent/login")
    .send({
      email: PARENT_EMAIL,
      password: PARENT_PASSWORD,
    })
    .expect(403);

  assert.equal(response.body.success, false);

  assert.equal(response.body.requiresEmailVerification, true);

  assert.equal(response.body.code, "EMAIL_NOT_VERIFIED");
});

test("wrong verification code is rejected", async () => {
  await createVerificationCode("123456");

  const response = await request(app)
    .post("/api/parent/verify-email")
    .send({
      email: PARENT_EMAIL,
      code: "654321",
    })
    .expect(400);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Invalid or expired verification code.");

  const parentResult = await pool.query(
    `
        SELECT
          email_verified_at
        FROM parents
        WHERE id = $1;
        `,
    [parentId],
  );

  assert.equal(parentResult.rows[0].email_verified_at, null);
});

test("expired verification code is rejected", async () => {
  await createVerificationCode("111111", -10);

  const response = await request(app)
    .post("/api/parent/verify-email")
    .send({
      email: PARENT_EMAIL,
      code: "111111",
    })
    .expect(400);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Invalid or expired verification code.");

  const parentResult = await pool.query(
    `
        SELECT
          email_verified_at
        FROM parents
        WHERE id = $1;
        `,
    [parentId],
  );

  assert.equal(parentResult.rows[0].email_verified_at, null);
});

test("valid verification code verifies parent", async () => {
  await createVerificationCode("222222");

  const response = await request(app)
    .post("/api/parent/verify-email")
    .send({
      email: PARENT_EMAIL,
      code: "222222",
    })
    .expect(200);

  assert.equal(response.body.success, true);

  const parentResult = await pool.query(
    `
        SELECT
          email_verified_at
        FROM parents
        WHERE id = $1;
        `,
    [parentId],
  );

  assert.ok(parentResult.rows[0].email_verified_at);

  const codeResult = await pool.query(
    `
        SELECT
          used_at
        FROM
          parent_email_verification_codes
        WHERE parent_id = $1;
        `,
    [parentId],
  );

  assert.equal(codeResult.rows.length, 1);

  assert.ok(codeResult.rows[0].used_at);
});

test("used verification code cannot be reused", async () => {
  await createVerificationCode("333333");

  await request(app)
    .post("/api/parent/verify-email")
    .send({
      email: PARENT_EMAIL,
      code: "333333",
    })
    .expect(200);

  await pool.query(
    `
      UPDATE parents
      SET email_verified_at = NULL
      WHERE id = $1;
      `,
    [parentId],
  );

  const response = await request(app)
    .post("/api/parent/verify-email")
    .send({
      email: PARENT_EMAIL,
      code: "333333",
    })
    .expect(400);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Invalid or expired verification code.");
});

test("verified parent can login", async () => {
  await pool.query(
    `
      UPDATE parents
      SET email_verified_at = NOW()
      WHERE id = $1;
      `,
    [parentId],
  );

  const response = await request(app)
    .post("/api/parent/login")
    .send({
      email: PARENT_EMAIL,
      password: PARENT_PASSWORD,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  assert.equal(response.body.parent.email, PARENT_EMAIL);

  const cookies = response.headers["set-cookie"];

  assert.ok(Array.isArray(cookies));

  assert.ok(cookies.some((cookie) => cookie.startsWith("parentAccessToken=")));

  assert.ok(cookies.some((cookie) => cookie.startsWith("parentRefreshToken=")));
});

test("new verification code invalidates previous active code", async () => {
  const oldCode = "444444";

  const newCode = "555555";

  const oldDigest = hashEmailVerificationCode(parentId, oldCode);

  await createParentVerificationCode({
    parentId,
    codeDigest: oldDigest,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await deleteActiveParentVerificationCodes(parentId);

  const newDigest = hashEmailVerificationCode(parentId, newCode);

  await createParentVerificationCode({
    parentId,
    codeDigest: newDigest,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  const oldCodeResult = await pool.query(
    `
        SELECT id
        FROM
          parent_email_verification_codes
        WHERE
          parent_id = $1
          AND code_hash = $2;
        `,
    [parentId, oldDigest],
  );

  assert.equal(oldCodeResult.rows.length, 0);

  const oldResponse = await request(app)
    .post("/api/parent/verify-email")
    .send({
      email: PARENT_EMAIL,
      code: oldCode,
    })
    .expect(400);

  assert.equal(oldResponse.body.success, false);

  const newResponse = await request(app)
    .post("/api/parent/verify-email")
    .send({
      email: PARENT_EMAIL,
      code: newCode,
    })
    .expect(200);

  assert.equal(newResponse.body.success, true);
});

test("unverified parent cannot refresh session", async () => {
  const parentResult = await pool.query(
    `
        SELECT
          id,
          name,
          email,
          created_at
        FROM parents
        WHERE id = $1;
        `,
    [parentId],
  );

  const parent = parentResult.rows[0];

  const refreshToken = generateParentRefreshToken(parent);

  await pool.query(
    `
      UPDATE parents
      SET
        email_verified_at = NULL,
        refresh_token = $1
      WHERE id = $2;
      `,
    [hashToken(refreshToken), parentId],
  );

  const response = await request(app)
    .post("/api/parent/refresh")
    .set("Cookie", `parentRefreshToken=${refreshToken}`)
    .expect(403);

  assert.equal(response.body.success, false);

  assert.equal(response.body.requiresEmailVerification, true);

  assert.equal(response.body.code, "EMAIL_NOT_VERIFIED");

  const updatedParent = await pool.query(
    `
        SELECT
          refresh_token
        FROM parents
        WHERE id = $1;
        `,
    [parentId],
  );

  assert.equal(updatedParent.rows[0].refresh_token, null);
});
