
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
  "admin-2fa-access-check-";

function createChallengeToken(
  id,
  email,
) {
  return jwt.sign(
    {
      id,
      email,

      type:
        "admin_2fa_challenge",
    },

    process.env
      .ADMIN_JWT_SECRET,

    {
      expiresIn:
        "5m",
    },
  );
}

async function insertAdmin({
  email,
  enabled,
  expiresAt,
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
        '2FA Access Test',
        $1,
        'unused-test-hash',
        'admin',
        $2,
        $3
      )
      RETURNING id;
      `,
      [
        email,
        enabled,
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

  await pool.end();
});

test(
  "2FA challenge rejects an admin disabled after password step",
  async () => {
    const email =
      `${EMAIL_PREFIX}disabled@example.com`;

    const id =
      await insertAdmin({
        email,
        enabled:
          false,
        expiresAt:
          null,
      });

    const challenge =
      createChallengeToken(
        id,
        email,
      );

    const response =
      await request(app)
        .post(
          "/api/admin/2fa/challenge",
        )
        .set(
          "Cookie",
          `adminTwoFactorChallenge=${challenge}`,
        )
        .send({
          token:
            "123456",
        })
        .expect(403);

    assert.equal(
      response.body.code,
      "ADMIN_ACCOUNT_DISABLED",
    );
  },
);

test(
  "2FA challenge rejects an admin expired after password step",
  async () => {
    const email =
      `${EMAIL_PREFIX}expired@example.com`;

    const id =
      await insertAdmin({
        email,

        enabled:
          true,

        expiresAt:
          new Date(
            Date.now() -
            60 * 1000,
          ),
      });

    const challenge =
      createChallengeToken(
        id,
        email,
      );

    const response =
      await request(app)
        .post(
          "/api/admin/2fa/challenge",
        )
        .set(
          "Cookie",
          `adminTwoFactorChallenge=${challenge}`,
        )
        .send({
          token:
            "123456",
        })
        .expect(403);

    assert.equal(
      response.body.code,
      "ADMIN_ACCESS_EXPIRED",
    );
  },
);
