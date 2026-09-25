import test, { before, after } from "node:test";

import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import pool from "../src/config/db.js";

const ADMIN_EMAIL = "authorization.admin@example.com";

const ADMIN_PASSWORD = "AdminAuthorizationPassword123!";

let adminId;
let validAdminToken;

before(async () => {
  /*
   * Safety check.
   * Never run this integration test
   * against development/production DB.
   */
  const dbCheck = await pool.query(`
      SELECT
        current_database()
          AS database_name;
    `);

  assert.equal(dbCheck.rows[0].database_name, "amanak_alraqami_test");

  /*
   * Clear Admin test data.
   */
  await pool.query(`
    TRUNCATE TABLE admins
    RESTART IDENTITY
    CASCADE;
  `);

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const result = await pool.query(
    `
      INSERT INTO admins (
        name,
        email,
        hashed_password
      )
      VALUES (
        $1,
        $2,
        $3
      )
      RETURNING id;
      `,
    ["Authorization Test Admin", ADMIN_EMAIL, hashedPassword],
  );

  adminId = result.rows[0].id;

  /*
   * Create a valid Admin access token
   * matching protectAdmin's expected
   * token structure.
   */
  validAdminToken = jwt.sign(
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
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE admins
    RESTART IDENTITY
    CASCADE;
  `);

  await pool.end();
});

/*
 * All routes below are expected
 * to require protectAdmin.
 */
const protectedAdminRoutes = [
  {
    method: "get",
    path: "/api/admin/me",
  },
  {
    method: "post",
    path: "/api/admin/logout",
  },
  {
    method: "post",
    path: "/api/admin/2fa/setup",
  },
  {
    method: "post",
    path: "/api/admin/2fa/confirm",
  },
  {
    method: "post",
    path: "/api/admin/2fa/recovery-codes/regenerate",
  },
  {
    method: "get",
    path: "/api/admin/dashboard",
  },
  {
    method: "get",
    path: "/api/admin/analytics",
  },
  {
    method: "get",
    path: "/api/admin/security/audit",
  },
  {
    method: "get",
    path: "/api/admin/students/status",
  },
  {
    method: "get",
    path: "/api/admin/students/1",
  },
  {
    method: "patch",
    path: "/api/admin/students/1/disable",
  },
  {
    method: "patch",
    path: "/api/admin/students/1/enable",
  },
  {
    method: "delete",
    path: "/api/admin/students/1/permanent",
  },
  {
    method: "get",
    path: "/api/admin/adventures",
  },
  {
    method: "post",
    path: "/api/admin/adventures",
  },
  {
    method: "put",
    path: "/api/admin/adventures/1",
  },
  {
    method: "delete",
    path: "/api/admin/adventures/1",
  },
  {
    method: "patch",
    path: "/api/admin/adventures/1/image",
  },
  {
    method: "get",
    path: "/api/admin/trash/adventures",
  },
  {
    method: "patch",
    path: "/api/admin/trash/adventures/1/restore",
  },
  {
    method: "delete",
    path: "/api/admin/trash/adventures/1/permanent",
  },
  {
    method: "get",
    path: "/api/admin/questions",
  },
  {
    method: "post",
    path: "/api/admin/questions",
  },
  {
    method: "put",
    path: "/api/admin/questions/1",
  },
  {
    method: "delete",
    path: "/api/admin/questions/1",
  },
  {
    method: "patch",
    path: "/api/admin/questions/1/image",
  },
  {
    method: "get",
    path: "/api/admin/trash/questions",
  },
  {
    method: "patch",
    path: "/api/admin/trash/questions/1/restore",
  },
  {
    method: "delete",
    path: "/api/admin/trash/questions/1/permanent",
  },
  {
    method: "post",
    path: "/api/admin/media/upload",
  },
  {
    method: "get",
    path: "/api/admin/media",
  },
  {
    method: "delete",
    path: "/api/admin/media/1",
  },
  {
    method: "get",
    path: "/api/admin/trash/media",
  },
  {
    method: "patch",
    path: "/api/admin/trash/media/1/restore",
  },
  {
    method: "delete",
    path: "/api/admin/trash/media/1/permanent",
  },
];

test("all protected Admin routes reject unauthenticated requests", async () => {
  for (const route of protectedAdminRoutes) {
    const response = await request(app)[route.method](route.path);

    assert.equal(
      response.status,
      401,
      `${route.method.toUpperCase()} ${route.path} should require Admin authentication`,
    );

    assert.equal(
      response.body.success,
      false,
      `${route.method.toUpperCase()} ${route.path} should return success:false`,
    );
  }
});

test("valid Admin access token can access /admin/me", async () => {
  const response = await request(app)
    .get("/api/admin/me")
    .set("Cookie", `adminAccessToken=${validAdminToken}`)
    .expect(200);

  assert.equal(response.body.success, true);

  assert.equal(Number(response.body.admin.id), Number(adminId));

  assert.equal(response.body.admin.email, ADMIN_EMAIL);
});

test("token with wrong role cannot access Admin routes", async () => {
  const wrongRoleToken = jwt.sign(
    {
      id: adminId,
      type: "parent",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  const response = await request(app)
    .get("/api/admin/dashboard")
    .set("Cookie", `adminAccessToken=${wrongRoleToken}`)
    .expect(403);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Admin access required");
});

test("expired Admin access token is rejected", async () => {
  const expiredToken = jwt.sign(
    {
      id: adminId,
      type: "admin",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: -10,
    },
  );

  const response = await request(app)
    .get("/api/admin/dashboard")
    .set("Cookie", `adminAccessToken=${expiredToken}`)
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Invalid or expired admin token");
});

test("tampered Admin access token is rejected", async () => {
  const tamperedToken = `${validAdminToken}tampered`;

  const response = await request(app)
    .get("/api/admin/dashboard")
    .set("Cookie", `adminAccessToken=${tamperedToken}`)
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Invalid or expired admin token");
});

test("Admin token for nonexistent account is rejected", async () => {
  const missingAdminToken = jwt.sign(
    {
      id: 999999999,
      type: "admin",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  const response = await request(app)
    .get("/api/admin/dashboard")
    .set("Cookie", `adminAccessToken=${missingAdminToken}`)
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Admin account not found");
});

test("Parent-style cookie cannot authenticate to Admin routes", async () => {
  const parentStyleToken = jwt.sign(
    {
      id: 1,
      type: "parent",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  const response = await request(app)
    .get("/api/admin/dashboard")
    .set("Cookie", `parentAccessToken=${parentStyleToken}`)
    .expect(401);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Admin not authenticated");
});
