import test, {
  before,
  after,
} from "node:test";

import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../src/app.js";
import pool from "../src/config/db.js";

const EMAIL_PREFIX =
  "test-admin-authorization-test";

let fullAdminId;
let testAdminId;
let disabledTestAdminId;
let expiredTestAdminId;

function createAdminToken(id, email) {
  return jwt.sign(
    {
      id,
      email,
      type: "admin",
    },
    process.env.ADMIN_JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );
}

async function insertAdmin({
  name,
  email,
  role,
  isEnabled = true,
  expiresAt = null,
}) {
  const result =
    await pool.query(
      `
      INSERT INTO admins (
        name,
        email,
        hashed_password,
        role,
        is_enabled,
        access_expires_at
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
        name,
        email,
        "test-password-hash",
        role,
        isEnabled,
        expiresAt,
      ],
    );

  return result.rows[0].id;
}

before(async () => {
  const db =
    await pool.query(`
      SELECT current_database()
        AS database_name;
    `);

  assert.equal(
    db.rows[0].database_name,
    "amanak_alraqami_test",
  );

  await pool.query(
    `
    DELETE FROM admins
    WHERE email LIKE $1;
    `,
    [`${EMAIL_PREFIX}%`],
  );

  fullAdminId =
    await insertAdmin({
      name: "Full Admin Test",
      email:
        `${EMAIL_PREFIX}-full@example.com`,
      role: "admin",
    });

  testAdminId =
    await insertAdmin({
      name: "Test Admin Test",
      email:
        `${EMAIL_PREFIX}-demo@example.com`,
      role: "test_admin",
      expiresAt:
        new Date(
          Date.now() +
          24 * 60 * 60 * 1000,
        ),
    });

  disabledTestAdminId =
    await insertAdmin({
      name:
        "Disabled Test Admin Test",
      email:
        `${EMAIL_PREFIX}-disabled@example.com`,
      role: "test_admin",
      isEnabled: false,
    });

  expiredTestAdminId =
    await insertAdmin({
      name:
        "Expired Test Admin Test",
      email:
        `${EMAIL_PREFIX}-expired@example.com`,
      role: "test_admin",
      expiresAt:
        new Date(
          Date.now() -
          24 * 60 * 60 * 1000,
        ),
    });
});

after(async () => {
  await pool.query(
    `
    DELETE FROM admins
    WHERE email LIKE $1;
    `,
    [`${EMAIL_PREFIX}%`],
  );

  await pool.end();
});

test(
  "full admin can access security audit",
  async () => {
    const email =
      `${EMAIL_PREFIX}-full@example.com`;

    const token =
      createAdminToken(
        fullAdminId,
        email,
      );

    const response =
      await request(app)
        .get(
          "/api/admin/security/audit",
        )
        .set(
          "Cookie",
          `adminAccessToken=${token}`,
        )
        .expect(200);

    assert.equal(
      response.body.success,
      true,
    );
  },
);

test(
  "test admin can access /admin/me and exposes test role",
  async () => {
    const email =
      `${EMAIL_PREFIX}-demo@example.com`;

    const token =
      createAdminToken(
        testAdminId,
        email,
      );

    const response =
      await request(app)
        .get("/api/admin/me")
        .set(
          "Cookie",
          `adminAccessToken=${token}`,
        )
        .expect(200);

    assert.equal(
      response.body.success,
      true,
    );

    assert.equal(
      response.body.admin.role,
      "test_admin",
    );

    assert.equal(
      response.body.admin.is_enabled,
      true,
    );
  },
);

test(
  "test admin can access dashboard",
  async () => {
    const email =
      `${EMAIL_PREFIX}-demo@example.com`;

    const token =
      createAdminToken(
        testAdminId,
        email,
      );

    await request(app)
      .get("/api/admin/dashboard")
      .set(
        "Cookie",
        `adminAccessToken=${token}`,
      )
      .expect(200);
  },
);

test(
  "test admin can access adventures",
  async () => {
    const email =
      `${EMAIL_PREFIX}-demo@example.com`;

    const token =
      createAdminToken(
        testAdminId,
        email,
      );

    await request(app)
      .get("/api/admin/adventures")
      .set(
        "Cookie",
        `adminAccessToken=${token}`,
      )
      .expect(200);
  },
);

test(
  "test admin cannot access security audit",
  async () => {
    const email =
      `${EMAIL_PREFIX}-demo@example.com`;

    const token =
      createAdminToken(
        testAdminId,
        email,
      );

    const response =
      await request(app)
        .get(
          "/api/admin/security/audit",
        )
        .set(
          "Cookie",
          `adminAccessToken=${token}`,
        )
        .expect(403);

    assert.equal(
      response.body.success,
      false,
    );

    assert.equal(
      response.body.code,
      "FULL_ADMIN_REQUIRED",
    );
  },
);

test(
  "test admin cannot permanently delete a student",
  async () => {
    const email =
      `${EMAIL_PREFIX}-demo@example.com`;

    const token =
      createAdminToken(
        testAdminId,
        email,
      );

    const response =
      await request(app)
        .delete(
          "/api/admin/students/999999999/permanent",
        )
        .set(
          "Cookie",
          `adminAccessToken=${token}`,
        )
        .send({
          confirmation: "DELETE",
        })
        .expect(403);

    assert.equal(
      response.body.code,
      "FULL_ADMIN_REQUIRED",
    );
  },
);

test(
  "test admin cannot access admin 2FA settings",
  async () => {
    const email =
      `${EMAIL_PREFIX}-demo@example.com`;

    const token =
      createAdminToken(
        testAdminId,
        email,
      );

    const response =
      await request(app)
        .get("/api/admin/2fa/status")
        .set(
          "Cookie",
          `adminAccessToken=${token}`,
        )
        .expect(403);

    assert.equal(
      response.body.code,
      "FULL_ADMIN_REQUIRED",
    );
  },
);

test(
  "disabled test admin cannot access protected routes",
  async () => {
    const email =
      `${EMAIL_PREFIX}-disabled@example.com`;

    const token =
      createAdminToken(
        disabledTestAdminId,
        email,
      );

    const response =
      await request(app)
        .get("/api/admin/me")
        .set(
          "Cookie",
          `adminAccessToken=${token}`,
        )
        .expect(403);

    assert.equal(
      response.body.code,
      "ADMIN_ACCOUNT_DISABLED",
    );
  },
);

test(
  "expired test admin cannot access protected routes",
  async () => {
    const email =
      `${EMAIL_PREFIX}-expired@example.com`;

    const token =
      createAdminToken(
        expiredTestAdminId,
        email,
      );

    const response =
      await request(app)
        .get("/api/admin/me")
        .set(
          "Cookie",
          `adminAccessToken=${token}`,
        )
        .expect(403);

    assert.equal(
      response.body.code,
      "ADMIN_ACCESS_EXPIRED",
    );
  },
);
