import test, { before, after } from "node:test";

import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app.js";
import pool from "../src/config/db.js";

const PARENT_A_EMAIL = "parent.a.authorization@example.com";

const PARENT_B_EMAIL = "parent.b.authorization@example.com";

const PARENT_PASSWORD = "ParentAuthorizationPassword123!";

const CHILD_PASSWORD = "ChildAuthorizationPassword123!";

let parentAId;
let parentBId;

let childAId;
let childBId;

let parentAAgent;
let parentBAgent;

async function loginParent(email) {
  const agent = request.agent(app);

  const response = await agent
    .post("/api/parent/login")
    .send({
      email,
      password: PARENT_PASSWORD,
    })
    .expect(200);

  assert.equal(response.body.success, true);

  assert.equal(response.body.requiresTwoFactor, false);

  assert.ok(response.body.parent);

  return agent;
}

before(async () => {
  /*
   * Safety check.
   * This integration test must only
   * run against the dedicated test DB.
   */
  const dbCheck = await pool.query(`
      SELECT
        current_database()
          AS database_name;
    `);

  assert.equal(dbCheck.rows[0].database_name, "amanak_alraqami_test");

  /*
   * Clear related test data.
   */
  await pool.query(`
    TRUNCATE TABLE
      parent_children,
      users,
      parents
    RESTART IDENTITY
    CASCADE;
  `);

  const parentPasswordHash = await bcrypt.hash(PARENT_PASSWORD, 10);

  /*
   * Create Parent A.
   */
  const parentAResult = await pool.query(
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
    ["Authorization Parent A", PARENT_A_EMAIL, parentPasswordHash],
  );

  parentAId = parentAResult.rows[0].id;

  /*
   * Create Parent B.
   */
  const parentBResult = await pool.query(
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
    ["Authorization Parent B", PARENT_B_EMAIL, parentPasswordHash],
  );

  parentBId = parentBResult.rows[0].id;

  const childPasswordHash = await bcrypt.hash(CHILD_PASSWORD, 10);

  /*
   * Create Child A.
   *
   * We intentionally allow the database
   * defaults to provide fields such as
   * current_level, total_points,
   * and is_enabled.
   */
  const childAResult = await pool.query(
    `
      INSERT INTO users (
        nickname,
        hashed_password,
        age_group,
        avatar
      )
      VALUES (
        $1,
        $2,
        $3,
        $4
      )
      RETURNING id;
      `,
    ["AuthorizationChildA", childPasswordHash, "8-10", "explorer"],
  );

  childAId = childAResult.rows[0].id;

  /*
   * Create Child B.
   */
  const childBResult = await pool.query(
    `
      INSERT INTO users (
        nickname,
        hashed_password,
        age_group,
        avatar
      )
      VALUES (
        $1,
        $2,
        $3,
        $4
      )
      RETURNING id;
      `,
    ["AuthorizationChildB", childPasswordHash, "11-14", "guardian"],
  );

  childBId = childBResult.rows[0].id;

  /*
   * Parent A is linked only
   * to Child A.
   */
  await pool.query(
    `
    INSERT INTO parent_children (
      parent_id,
      child_id
    )
    VALUES ($1, $2);
    `,
    [parentAId, childAId],
  );

  /*
   * Parent B is linked only
   * to Child B.
   */
  await pool.query(
    `
    INSERT INTO parent_children (
      parent_id,
      child_id
    )
    VALUES ($1, $2);
    `,
    [parentBId, childBId],
  );

  /*
   * Log in both Parents.
   */
  parentAAgent = await loginParent(PARENT_A_EMAIL);

  parentBAgent = await loginParent(PARENT_B_EMAIL);
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE
      parent_children,
      users,
      parents
    RESTART IDENTITY
    CASCADE;
  `);

  await pool.end();
});

test("Parent A can access their linked Child A dashboard", async () => {
  const response = await parentAAgent
    .get(`/api/parent/children/${childAId}/dashboard`)
    .expect(200);

  assert.equal(response.body.success, true);

  assert.ok(response.body.dashboard);

  assert.equal(Number(response.body.dashboard.child.id), Number(childAId));

  assert.equal(response.body.dashboard.child.nickname, "AuthorizationChildA");
});

test("Parent A cannot access Parent B's child dashboard", async () => {
  const response = await parentAAgent
    .get(`/api/parent/children/${childBId}/dashboard`)
    .expect(404);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Linked child not found");

  assert.equal(response.body.dashboard, undefined);
});

test("Parent B cannot access Parent A's child dashboard", async () => {
  const response = await parentBAgent
    .get(`/api/parent/children/${childAId}/dashboard`)
    .expect(404);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Linked child not found");

  assert.equal(response.body.dashboard, undefined);
});

test("unauthenticated user cannot access a Parent child dashboard", async () => {
  const response = await request(app)
    .get(`/api/parent/children/${childAId}/dashboard`)
    .expect(401);

  assert.equal(response.body.success, false);
});

test("invalid child ID is rejected", async () => {
  const response = await parentAAgent
    .get("/api/parent/children/not-a-number/dashboard")
    .expect(400);

  assert.equal(response.body.success, false);
});

test("nonexistent child ID does not expose dashboard data", async () => {
  const response = await parentAAgent
    .get("/api/parent/children/999999999/dashboard")
    .expect(404);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Linked child not found");

  assert.equal(response.body.dashboard, undefined);
});
