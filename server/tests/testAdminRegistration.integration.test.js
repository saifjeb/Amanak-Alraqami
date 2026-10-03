
import test, {
  before,
  after,
} from "node:test";

import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import app from "../src/app.js";
import pool from "../src/config/db.js";

const EMAIL_PREFIX =
  "test-admin-registration-";

let fullAdminId;

function createAdminToken(
  id,
  email,
) {
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
    await pool.query(
      `
      SELECT
        current_database()
          AS database_name;
      `,
    );

  assert.equal(
    db.rows[0]
      .database_name,
    "amanak_alraqami_test",
  );

  await pool.query(
    `
    DELETE FROM admins
    WHERE email LIKE $1;
    `,
    [
      `${EMAIL_PREFIX}%`,
    ],
  );

  await pool.query(
    `
    UPDATE test_admin_access_settings
    SET
      registration_enabled = FALSE,
      updated_at = NOW()
    WHERE id = 1;
    `,
  );

  fullAdminId =
    await insertAdmin({
      name:
        "Test Admin Registration Full Admin",

      email:
        `${EMAIL_PREFIX}full@example.com`,

      role:
        "admin",
    });
});

after(async () => {
  await pool.query(
    `
    DELETE FROM admins
    WHERE email LIKE $1;
    `,
    [
      `${EMAIL_PREFIX}%`,
    ],
  );

  await pool.query(
    `
    UPDATE test_admin_access_settings
    SET
      registration_enabled = FALSE,
      updated_at = NOW()
    WHERE id = 1;
    `,
  );

  await pool.end();
});

test(
  "test-admin registration is disabled by default",
  async () => {
    const response =
      await request(app)
        .get(
          "/api/admin/test-registration/status",
        )
        .expect(200);

    assert.equal(
      response.body.success,
      true,
    );

    assert.equal(
      response.body.registration_enabled,
      false,
    );
  },
);

test(
  "full admin can enable public test registration",
  async () => {
    const email =
      `${EMAIL_PREFIX}full@example.com`;

    const token =
      createAdminToken(
        fullAdminId,
        email,
      );

    const response =
      await request(app)
        .patch(
          "/api/admin/test-access/registration",
        )
        .set(
          "Cookie",
          `adminAccessToken=${token}`,
        )
        .send({
          enabled: true,
        })
        .expect(200);

    assert.equal(
      response.body.registration_enabled,
      true,
    );
  },
);

test(
  "public registration creates a 30-day test_admin account",
  async () => {
    const email =
      `${EMAIL_PREFIX}created@example.com`;

    const password =
      "StrongTestPassword123!";

    const response =
      await request(app)
        .post(
          "/api/admin/test-registration",
        )
        .send({
          name:
            "Public Test User",

          email,

          password,

          confirmPassword:
            password,
        })
        .expect(201);

    assert.equal(
      response.body.success,
      true,
    );

    assert.equal(
      response.body
        .admin
        .role,
      "test_admin",
    );

    assert.equal(
      response.body
        .admin
        .is_enabled,
      true,
    );

    const db =
      await pool.query(
        `
        SELECT
          hashed_password,
          role,
          is_enabled,
          access_expires_at
        FROM admins
        WHERE email = $1
        LIMIT 1;
        `,
        [
          email,
        ],
      );

    assert.equal(
      db.rows.length,
      1,
    );

    assert.equal(
      db.rows[0].role,
      "test_admin",
    );

    assert.equal(
      db.rows[0].is_enabled,
      true,
    );

    const passwordMatches =
      await bcrypt.compare(
        password,
        db.rows[0]
          .hashed_password,
      );

    assert.equal(
      passwordMatches,
      true,
    );

    const remaining =
      new Date(
        db.rows[0]
          .access_expires_at,
      ).getTime() -
      Date.now();

    const day =
      24 *
      60 *
      60 *
      1000;

    assert.ok(
      remaining >
        29 * day,
    );

    assert.ok(
      remaining <=
        30 * day,
    );
  },
);

test(
  "public registration cannot choose the admin role",
  async () => {
    const email =
      `${EMAIL_PREFIX}role@example.com`;

    await request(app)
      .post(
        "/api/admin/test-registration",
      )
      .send({
        name:
          "Role Injection Test",

        email,

        password:
          "StrongTestPassword123!",

        confirmPassword:
          "StrongTestPassword123!",

        role:
          "admin",
      })
      .expect(400);

    const result =
      await pool.query(
        `
        SELECT id
        FROM admins
        WHERE email = $1;
        `,
        [
          email,
        ],
      );

    assert.equal(
      result.rows.length,
      0,
    );
  },
);

test(
  "full admin can view test-admin access management",
  async () => {
    const email =
      `${EMAIL_PREFIX}full@example.com`;

    const token =
      createAdminToken(
        fullAdminId,
        email,
      );

    const response =
      await request(app)
        .get(
          "/api/admin/test-access",
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

    assert.ok(
      Array.isArray(
        response.body
          .accounts,
      ),
    );
  },
);

test(
  "test_admin cannot access full-admin test-access management",
  async () => {
    const email =
      `${EMAIL_PREFIX}restricted@example.com`;

    const id =
      await insertAdmin({
        name:
          "Restricted Test Admin",

        email,

        role:
          "test_admin",

        expiresAt:
          new Date(
            Date.now() +
            30 *
              24 *
              60 *
              60 *
              1000,
          ),
      });

    const token =
      createAdminToken(
        id,
        email,
      );

    const response =
      await request(app)
        .get(
          "/api/admin/test-access",
        )
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
  "full admin can disable public test registration",
  async () => {
    const email =
      `${EMAIL_PREFIX}full@example.com`;

    const token =
      createAdminToken(
        fullAdminId,
        email,
      );

    try {
      const toggle =
        await request(app)
          .patch(
            "/api/admin/test-access/registration",
          )
          .set(
            "Cookie",
            `adminAccessToken=${token}`,
          )
          .send({
            enabled:
              false,
          })
          .expect(200);

      assert.equal(
        toggle.body
          .registration_enabled,
        false,
      );

      const response =
        await request(app)
          .post(
            "/api/admin/test-registration",
          )
          .send({
            name:
              "Blocked Registration",

            email:
              `${EMAIL_PREFIX}blocked@example.com`,

            password:
              "StrongTestPassword123!",

            confirmPassword:
              "StrongTestPassword123!",
          })
          .expect(403);

      assert.equal(
        response.body.code,
        "TEST_ADMIN_REGISTRATION_DISABLED",
      );
    } finally {
      await pool.query(
        `
        UPDATE test_admin_access_settings
        SET
          registration_enabled = TRUE,
          updated_at = NOW()
        WHERE id = 1;
        `,
      );
    }
  },
);

test(
  "full admin can disable an individual test_admin account",
  async () => {
    const fullEmail =
      `${EMAIL_PREFIX}full@example.com`;

    const fullToken =
      createAdminToken(
        fullAdminId,
        fullEmail,
      );

    const testEmail =
      `${EMAIL_PREFIX}disable@example.com`;

    const testId =
      await insertAdmin({
        name:
          "Disable Test Admin",

        email:
          testEmail,

        role:
          "test_admin",

        expiresAt:
          new Date(
            Date.now() +
            30 *
              24 *
              60 *
              60 *
              1000,
          ),
      });

    await request(app)
      .patch(
        `/api/admin/test-access/accounts/${testId}/disable`,
      )
      .set(
        "Cookie",
        `adminAccessToken=${fullToken}`,
      )
      .expect(200);

    const testToken =
      createAdminToken(
        testId,
        testEmail,
      );

    const response =
      await request(app)
        .get(
          "/api/admin/me",
        )
        .set(
          "Cookie",
          `adminAccessToken=${testToken}`,
        )
        .expect(403);

    assert.equal(
      response.body.code,
      "ADMIN_ACCOUNT_DISABLED",
    );
  },
);

test(
  "full admin cannot re-enable an expired test_admin account",
  async () => {
    const fullEmail =
      `${EMAIL_PREFIX}full@example.com`;

    const fullToken =
      createAdminToken(
        fullAdminId,
        fullEmail,
      );

    const expiredEmail =
      `${EMAIL_PREFIX}expired-enable@example.com`;

    const expiredId =
      await insertAdmin({
        name:
          "Expired Test Admin",

        email:
          expiredEmail,

        role:
          "test_admin",

        isEnabled:
          false,

        expiresAt:
          new Date(
            Date.now() -
            60 * 1000,
          ),
      });

    const response =
      await request(app)
        .patch(
          `/api/admin/test-access/accounts/${expiredId}/enable`,
        )
        .set(
          "Cookie",
          `adminAccessToken=${fullToken}`,
        )
        .expect(409);

    assert.equal(
      response.body.code,
      "TEST_ADMIN_ACCESS_EXPIRED",
    );

    const db =
      await pool.query(
        `
        SELECT is_enabled
        FROM admins
        WHERE id = $1;
        `,
        [
          expiredId,
        ],
      );

    assert.equal(
      db.rows[0].is_enabled,
      false,
    );
  },
);
