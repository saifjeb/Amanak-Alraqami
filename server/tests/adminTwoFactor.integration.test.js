import test, { before, beforeEach, after } from "node:test";

import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generate } from "otplib";

import app from "../src/app.js";
import pool from "../src/config/db.js";

import {
  createTwoFactorSetup,
  generateTwoFactorRecoveryCodes,
  hashTwoFactorRecoveryCode,
} from "../src/Utils/twoFactor.Utils.js";

const ADMIN_EMAIL = "twofactor.admin@example.com";

const ADMIN_PASSWORD = "AdminTwoFactorPassword123!";

let adminId;
let totpSecret;
let recoveryCode;

async function waitForStableTotpWindow() {
  const periodMs = 30 * 1000;

  const elapsed = Date.now() % periodMs;

  const remaining = periodMs - elapsed;

  if (remaining < 5000) {
    await new Promise((resolve) => setTimeout(resolve, remaining + 250));
  }
}

async function createCurrentTotp() {
  await waitForStableTotpWindow();

  return generate({
    secret: totpSecret,
  });
}

async function loginForTwoFactor(agent) {
  const response = await agent
    .post("/api/admin/login")
    .send({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  assert.equal(response.body.requiresTwoFactor, true);

  return response;
}

before(async () => {
  const dbCheck = await pool.query(`
      SELECT
        current_database()
          AS database_name;
    `);

  assert.equal(dbCheck.rows[0].database_name, "amanak_alraqami_test");

  await pool.query(`
    TRUNCATE TABLE
      two_factor_recovery_codes,
      admins
    RESTART IDENTITY
    CASCADE;
  `);

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
    ["2FA Integration Admin", ADMIN_EMAIL, hashedPassword],
  );

  adminId = adminResult.rows[0].id;

  const setup = createTwoFactorSetup({
    email: ADMIN_EMAIL,
    accountType: "admin",
  });

  totpSecret = setup.secret;

  await pool.query(
    `
    UPDATE admins
    SET
      two_factor_enabled = TRUE,
      two_factor_secret_encrypted = $1,
      two_factor_enabled_at = NOW(),
      two_factor_last_used_step = NULL
    WHERE id = $2;
    `,
    [setup.encryptedSecret, adminId],
  );
});

beforeEach(async () => {
  await pool.query(
    `
    UPDATE admins
    SET
      two_factor_last_used_step = NULL
    WHERE id = $1;
    `,
    [adminId],
  );

  await pool.query(
    `
    DELETE FROM
      two_factor_recovery_codes
    WHERE
      account_type = 'admin'
      AND account_id = $1;
    `,
    [adminId],
  );

  recoveryCode = generateTwoFactorRecoveryCodes(1)[0];

  const recoveryCodeHash = hashTwoFactorRecoveryCode({
    accountType: "admin",
    accountId: adminId,
    code: recoveryCode,
  });

  await pool.query(
    `
    INSERT INTO
      two_factor_recovery_codes (
        account_type,
        account_id,
        code_hash
      )
    VALUES (
      'admin',
      $1,
      $2
    );
    `,
    [adminId, recoveryCodeHash],
  );
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE
      two_factor_recovery_codes,
      admins
    RESTART IDENTITY
    CASCADE;
  `);

  await pool.end();
});

test("admin password login requires 2FA and does not grant admin access", async () => {
  const agent = request.agent(app);

  const loginResponse = await loginForTwoFactor(agent);

  const cookies = loginResponse.headers["set-cookie"] || [];

  const accessCookie = cookies.find((cookie) =>
    cookie.startsWith("adminAccessToken="),
  );

  const challengeCookie = cookies.find((cookie) =>
    cookie.startsWith("adminTwoFactorChallenge="),
  );

  if (accessCookie) {
    const accessCookieValue = accessCookie
      .split(";")[0]
      .substring("adminAccessToken=".length);

    assert.equal(accessCookieValue, "");
  }

  assert.ok(challengeCookie, "2FA challenge cookie should be created");

  const meResponse = await agent.get("/api/admin/me").expect(401);

  assert.equal(meResponse.body.success, false);
});

test("valid admin TOTP completes login", async () => {
  const agent = request.agent(app);

  await loginForTwoFactor(agent);

  const token = await createCurrentTotp();

  const response = await agent
    .post("/api/admin/2fa/challenge")
    .send({
      token,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  assert.equal(response.body.requiresTwoFactor, false);

  assert.equal(response.body.admin.email, ADMIN_EMAIL);

  const meResponse = await agent.get("/api/admin/me").expect(200);

  assert.equal(meResponse.body.success, true);

  assert.equal(meResponse.body.admin.email, ADMIN_EMAIL);
});

test("used admin TOTP cannot be reused", async () => {
  const token = await createCurrentTotp();

  const firstAgent = request.agent(app);

  await loginForTwoFactor(firstAgent);

  await firstAgent
    .post("/api/admin/2fa/challenge")
    .send({
      token,
    })
    .expect(200);

  const secondAgent = request.agent(app);

  await loginForTwoFactor(secondAgent);

  const response = await secondAgent
    .post("/api/admin/2fa/challenge")
    .send({
      token,
    })
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(
    response.body.message,
    "Invalid or already used authentication code.",
  );
});

test("wrong admin TOTP is rejected", async () => {
  const agent = request.agent(app);

  await loginForTwoFactor(agent);

  const validToken = await createCurrentTotp();

  const firstDigit = Number(validToken[0]);

  const wrongFirstDigit = (firstDigit + 1) % 10;

  const wrongToken = `${wrongFirstDigit}${validToken.slice(1)}`;

  const response = await agent
    .post("/api/admin/2fa/challenge")
    .send({
      token: wrongToken,
    })
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(
    response.body.message,
    "Invalid or already used authentication code.",
  );
});

test("valid admin recovery code completes login", async () => {
  const agent = request.agent(app);

  await loginForTwoFactor(agent);

  const response = await agent
    .post("/api/admin/2fa/challenge")
    .send({
      recoveryCode,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  assert.equal(response.body.requiresTwoFactor, false);

  const meResponse = await agent.get("/api/admin/me").expect(200);

  assert.equal(meResponse.body.success, true);
});

test("used admin recovery code cannot be reused", async () => {
  const firstAgent = request.agent(app);

  await loginForTwoFactor(firstAgent);

  await firstAgent
    .post("/api/admin/2fa/challenge")
    .send({
      recoveryCode,
    })
    .expect(200);

  const secondAgent = request.agent(app);

  await loginForTwoFactor(secondAgent);

  const response = await secondAgent
    .post("/api/admin/2fa/challenge")
    .send({
      recoveryCode,
    })
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(
    response.body.message,
    "Invalid or already used authentication code.",
  );
});

test("admin 2FA challenge without challenge cookie is rejected", async () => {
  const response = await request(app)
    .post("/api/admin/2fa/challenge")
    .send({
      token: "123456",
    })
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(response.body.code, "TWO_FACTOR_CHALLENGE_REQUIRED");
});

test("expired admin 2FA challenge is rejected", async () => {
  const expiredChallenge = jwt.sign(
    {
      id: adminId,
      email: ADMIN_EMAIL,
      type: "admin_2fa_challenge",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: -10,
    },
  );

  const response = await request(app)
    .post("/api/admin/2fa/challenge")
    .set("Cookie", `adminTwoFactorChallenge=${expiredChallenge}`)
    .send({
      token: "123456",
    })
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(response.body.code, "TWO_FACTOR_CHALLENGE_EXPIRED");
});
