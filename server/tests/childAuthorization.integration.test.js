import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import pool from "../src/config/db.js";

const CHILD_NICKNAME = "AuthorizationChild";
const CHILD_PASSWORD = "ChildAuthorizationPassword123!";

let childId;
let validChildToken;
let validRefreshToken;

before(async () => {
  const dbCheck = await pool.query(`
      SELECT
        current_database()
          AS database_name;
    `);

  assert.equal(dbCheck.rows[0].database_name, "amanak_alraqami_test");

  await pool.query(`
    TRUNCATE TABLE users
    RESTART IDENTITY
    CASCADE;
  `);

  const hashedPassword = await bcrypt.hash(CHILD_PASSWORD, 10);
  const result = await pool.query(
    `
      INSERT INTO users (nickname,hashed_password,age_group,avatar)
      VALUES ($1,$2,$3,$4)
      RETURNING id;
      `,
    [CHILD_NICKNAME, hashedPassword, "8-10", "explorer"],
  );

  childId = result.rows[0].id;
  validChildToken = jwt.sign(
    {
      id: childId,
      nickname: CHILD_NICKNAME,
      type: "child",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  validRefreshToken = jwt.sign(
    {
      id: childId,
      type: "child",
    },
    process.env.REFRESH_SECRET,
    {
      expiresIn: "30d",
    },
  );
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE users
    RESTART IDENTITY
    CASCADE;
  `);

  await pool.end();
});

test("unauthenticated user cannot access Child /auth/me", async () => {
  const response = await request(app).get("/api/auth/me").expect(401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Not authenticated");
});

test("valid Child access token can access /auth/me", async () => {
  const response = await request(app)
    .get("/api/auth/me")
    .set("Cookie", `accessToken=${validChildToken}`)
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(Number(response.body.user.id), Number(childId));
  assert.equal(response.body.user.nickname, CHILD_NICKNAME);
});

test("wrong-role token cannot access Child routes", async () => {

  const wrongRoleToken = jwt.sign(
    {
      id: childId,
      type: "parent",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  const response = await request(app)
    .get("/api/auth/me")
    .set("Cookie", `accessToken=${wrongRoleToken}`)
    .expect(403);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Child access required");
});

test("expired Child access token is rejected", async () => {
  const expiredToken = jwt.sign(
    {
      id: childId,
      type: "child",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: -10,
    },
  );

  const response = await request(app)
    .get("/api/auth/me")
    .set("Cookie", `accessToken=${expiredToken}`)
    .expect(401);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Invalid or expired access token");
});

test("tampered Child access token is rejected", async () => {
  const tamperedToken = `${validChildToken}tampered`;
  const response = await request(app)
    .get("/api/auth/me")
    .set("Cookie", `accessToken=${tamperedToken}`)
    .expect(401);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Invalid or expired access token");
});

test("Child token for nonexistent user is rejected", async () => {
  const missingUserToken = jwt.sign(
    {
      id: 999999999,
      type: "child",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  const response = await request(app)
    .get("/api/auth/me")
    .set("Cookie", `accessToken=${missingUserToken}`)
    .expect(401);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "User account not found");
});

test("disabled Child account cannot access protected Child route", async () => {
  await pool.query(
    `
      UPDATE users
      SET is_enabled = FALSE
      WHERE id = $1;
      `,
    [childId],
  );

  const response = await request(app)
    .get("/api/auth/me")
    .set("Cookie", `accessToken=${validChildToken}`)
    .expect(403);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Account is disabled");

  await pool.query(
    `
      UPDATE users
      SET is_enabled = TRUE
      WHERE id = $1;
      `,
    [childId],
  );
});

test("valid Child refresh token can refresh access token", async () => {
  const response = await request(app)
    .post("/api/auth/refresh")
    .set("Cookie", `refreshToken=${validRefreshToken}`)
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.message, "Access token refreshed successfully");
});

test("wrong-role refresh token is rejected", async () => {
  const wrongRoleRefreshToken = jwt.sign(
    {
      id: childId,
      type: "parent",
    },
    process.env.REFRESH_SECRET,
    {
      expiresIn: "30d",
    },
  );

  const response = await request(app)
    .post("/api/auth/refresh")
    .set("Cookie", `refreshToken=${wrongRoleRefreshToken}`)
    .expect(403);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Child access required");
});
