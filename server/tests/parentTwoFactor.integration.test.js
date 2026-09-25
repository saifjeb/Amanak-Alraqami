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

const PARENT_EMAIL = "twofactor.parent@example.com";

const PARENT_PASSWORD = "ParentTwoFactorPassword123!";

let parentId;
let totpSecret;
let encryptedSecret;
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

function getCookieValue(response, cookieName) {
  const cookies = response.headers["set-cookie"] || [];

  const cookie = cookies.find((item) => item.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  return cookie.split(";")[0].substring(`${cookieName}=`.length);
}

async function enableParentTwoFactor() {
  await pool.query(
    `
    UPDATE parents
    SET
      two_factor_enabled = TRUE,
      two_factor_secret_encrypted = $1,
      two_factor_enabled_at = NOW(),
      two_factor_last_used_step = NULL,
      refresh_token = NULL
    WHERE id = $2;
    `,
    [encryptedSecret, parentId],
  );
}

async function loginForTwoFactor(agent) {
  const response = await agent
    .post("/api/parent/login")
    .send({
      email: PARENT_EMAIL,
      password: PARENT_PASSWORD,
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
      parents
    RESTART IDENTITY
    CASCADE;
  `);

  const hashedPassword = await bcrypt.hash(PARENT_PASSWORD, 10);

  const parentResult = await pool.query(
    `
      INSERT INTO parents (
        name,
        email,
        hashed_password,
        email_verified_at
      )
      VALUES (
        $1,
        $2,
        $3,
        NOW()
      )
      RETURNING id;
      `,
    ["2FA Integration Parent", PARENT_EMAIL, hashedPassword],
  );

  parentId = parentResult.rows[0].id;

  const setup = createTwoFactorSetup({
    email: PARENT_EMAIL,
    accountType: "parent",
  });

  totpSecret = setup.secret;

  encryptedSecret = setup.encryptedSecret;
});

beforeEach(async () => {
  await pool.query(
    `
    UPDATE parents
    SET
      two_factor_enabled = TRUE,
      two_factor_secret_encrypted = $1,
      two_factor_enabled_at = NOW(),
      two_factor_last_used_step = NULL,
      refresh_token = NULL,
      email_verified_at = NOW()
    WHERE id = $2;
    `,
    [encryptedSecret, parentId],
  );

  await pool.query(
    `
    DELETE FROM
      two_factor_recovery_codes
    WHERE
      account_type = 'parent'
      AND account_id = $1;
    `,
    [parentId],
  );

  recoveryCode = generateTwoFactorRecoveryCodes(1)[0];

  const recoveryCodeHash = hashTwoFactorRecoveryCode({
    accountType: "parent",
    accountId: parentId,
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
      'parent',
      $1,
      $2
    );
    `,
    [parentId, recoveryCodeHash],
  );
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE
      two_factor_recovery_codes,
      parents
    RESTART IDENTITY
    CASCADE;
  `);

  await pool.end();
});

test("parent without 2FA can login normally", async () => {
  await pool.query(
    `
      UPDATE parents
      SET
        two_factor_enabled = FALSE,
        two_factor_last_used_step = NULL,
        refresh_token = NULL
      WHERE id = $1;
      `,
    [parentId],
  );

  const agent = request.agent(app);

  const response = await agent
    .post("/api/parent/login")
    .send({
      email: PARENT_EMAIL,
      password: PARENT_PASSWORD,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  assert.equal(response.body.requiresTwoFactor, false);

  assert.equal(response.body.parent.email, PARENT_EMAIL);

  const accessCookie = getCookieValue(response, "parentAccessToken");

  const refreshCookie = getCookieValue(response, "parentRefreshToken");

  assert.ok(accessCookie);

  assert.ok(refreshCookie);

  const meResponse = await agent.get("/api/parent/me").expect(200);

  assert.equal(meResponse.body.success, true);
});

test("parent password login with 2FA does not grant parent access", async () => {
  await enableParentTwoFactor();

  const agent = request.agent(app);

  const loginResponse = await loginForTwoFactor(agent);

  const accessCookie = getCookieValue(loginResponse, "parentAccessToken");

  const refreshCookie = getCookieValue(loginResponse, "parentRefreshToken");

  const challengeCookie = getCookieValue(
    loginResponse,
    "parentTwoFactorChallenge",
  );

  if (accessCookie !== null) {
    assert.equal(accessCookie, "");
  }

  if (refreshCookie !== null) {
    assert.equal(refreshCookie, "");
  }

  assert.ok(challengeCookie);

  const meResponse = await agent.get("/api/parent/me").expect(401);

  assert.equal(meResponse.body.success, false);
});

test("valid parent TOTP completes login", async () => {
  const agent = request.agent(app);

  await loginForTwoFactor(agent);

  const token = await createCurrentTotp();

  const response = await agent
    .post("/api/parent/2fa/challenge")
    .send({
      token,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  assert.equal(response.body.requiresTwoFactor, false);

  assert.equal(response.body.parent.email, PARENT_EMAIL);

  const meResponse = await agent.get("/api/parent/me").expect(200);

  assert.equal(meResponse.body.success, true);

  assert.equal(meResponse.body.parent.email, PARENT_EMAIL);
});

test("used parent TOTP cannot be reused", async () => {
  const token = await createCurrentTotp();

  const firstAgent = request.agent(app);

  await loginForTwoFactor(firstAgent);

  await firstAgent
    .post("/api/parent/2fa/challenge")
    .send({
      token,
    })
    .expect(200);

  const secondAgent = request.agent(app);

  await loginForTwoFactor(secondAgent);

  const response = await secondAgent
    .post("/api/parent/2fa/challenge")
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

test("wrong parent TOTP is rejected", async () => {
  const agent = request.agent(app);

  await loginForTwoFactor(agent);

  const validToken = await createCurrentTotp();

  const firstDigit = Number(validToken[0]);

  const wrongFirstDigit = (firstDigit + 1) % 10;

  const wrongToken = `${wrongFirstDigit}${validToken.slice(1)}`;

  const response = await agent
    .post("/api/parent/2fa/challenge")
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

test("valid parent recovery code completes login", async () => {
  const agent = request.agent(app);

  await loginForTwoFactor(agent);

  const response = await agent
    .post("/api/parent/2fa/challenge")
    .send({
      recoveryCode,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  assert.equal(response.body.requiresTwoFactor, false);

  const meResponse = await agent.get("/api/parent/me").expect(200);

  assert.equal(meResponse.body.success, true);
});

test("used parent recovery code cannot be reused", async () => {
  const firstAgent = request.agent(app);

  await loginForTwoFactor(firstAgent);

  await firstAgent
    .post("/api/parent/2fa/challenge")
    .send({
      recoveryCode,
    })
    .expect(200);

  const secondAgent = request.agent(app);

  await loginForTwoFactor(secondAgent);

  const response = await secondAgent
    .post("/api/parent/2fa/challenge")
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

test("parent 2FA challenge without challenge cookie is rejected", async () => {
  const response = await request(app)
    .post("/api/parent/2fa/challenge")
    .send({
      token: "123456",
    })
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(response.body.code, "TWO_FACTOR_CHALLENGE_REQUIRED");
});

test("expired parent 2FA challenge is rejected", async () => {
  const expiredChallenge = jwt.sign(
    {
      id: parentId,
      email: PARENT_EMAIL,
      type: "parent_2fa_challenge",
    },
    process.env.PARENT_REFRESH_SECRET,
    {
      expiresIn: -10,
    },
  );

  const response = await request(app)
    .post("/api/parent/2fa/challenge")
    .set("Cookie", `parentTwoFactorChallenge=${expiredChallenge}`)
    .send({
      token: "123456",
    })
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(response.body.code, "TWO_FACTOR_CHALLENGE_EXPIRED");
});
