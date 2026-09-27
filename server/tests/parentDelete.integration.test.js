import test, {
  before,
  beforeEach,
  after,
} from "node:test";

import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app.js";
import pool from "../src/config/db.js";

const PARENT_EMAIL =
  "delete.parent@example.com";

const OTHER_PARENT_EMAIL =
  "keep.parent@example.com";

const PARENT_PASSWORD =
  "DeleteParentPassword123!";

const WRONG_PASSWORD =
  "WrongParentPassword123!";

let parentId;
let otherParentId;
let childId;

async function loginParent(agent) {
  const response = await agent
    .post("/api/parent/login")
    .send({
      email: PARENT_EMAIL,
      password: PARENT_PASSWORD,
    })
    .expect(200);

  assert.equal(
    response.body.success,
    true,
  );

  assert.equal(
    response.body.requiresTwoFactor,
    false,
  );
}

before(async () => {
  const dbCheck = await pool.query(`
    SELECT current_database() AS database_name;
  `);

  assert.equal(
    dbCheck.rows[0].database_name,
    "amanak_alraqami_test",
  );
});

beforeEach(async () => {
  await pool.query(`
    TRUNCATE TABLE
      two_factor_recovery_codes,
      password_reset_tokens,
      parent_email_verification_codes,
      parent_children,
      link_codes,
      users,
      parents
    RESTART IDENTITY
    CASCADE;
  `);

  const passwordHash =
    await bcrypt.hash(
      PARENT_PASSWORD,
      10,
    );

  const parentsResult =
    await pool.query(
      `
      INSERT INTO parents (
        name,
        email,
        hashed_password,
        email_verified_at
      )
      VALUES
        (
          $1,
          $2,
          $3,
          NOW()
        ),
        (
          $4,
          $5,
          $6,
          NOW()
        )
      RETURNING
        id,
        email;
      `,
      [
        "Parent To Delete",
        PARENT_EMAIL,
        passwordHash,

        "Parent To Keep",
        OTHER_PARENT_EMAIL,
        passwordHash,
      ],
    );

  parentId =
    parentsResult.rows.find(
      (row) =>
        row.email === PARENT_EMAIL,
    ).id;

  otherParentId =
    parentsResult.rows.find(
      (row) =>
        row.email ===
        OTHER_PARENT_EMAIL,
    ).id;

  const childResult =
    await pool.query(
      `
      INSERT INTO users (
        nickname,
        hashed_password,
        age_group
      )
      VALUES (
        $1,
        $2,
        $3
      )
      RETURNING id;
      `,
      [
        "DeleteParentChild",
        "child-password-hash",
        "8-10",
      ],
    );

  childId =
    childResult.rows[0].id;

  await pool.query(
    `
    INSERT INTO parent_children (
      parent_id,
      child_id
    )
    VALUES ($1, $2);
    `,
    [
      parentId,
      childId,
    ],
  );

  await pool.query(
    `
    INSERT INTO link_codes (
      code,
      parent_id,
      expires_at
    )
    VALUES
      (
        '111111',
        $1,
        CURRENT_TIMESTAMP
          + INTERVAL '10 minutes'
      ),
      (
        '222222',
        $2,
        CURRENT_TIMESTAMP
          + INTERVAL '10 minutes'
      );
    `,
    [
      parentId,
      otherParentId,
    ],
  );

  await pool.query(
    `
    INSERT INTO
      parent_email_verification_codes (
        parent_id,
        code_hash,
        expires_at
      )
    VALUES (
      $1,
      $2,
      CURRENT_TIMESTAMP
        + INTERVAL '10 minutes'
    );
    `,
    [
      parentId,
      "a".repeat(64),
    ],
  );

  await pool.query(
    `
    INSERT INTO password_reset_tokens (
      account_type,
      account_id,
      token_hash,
      expires_at
    )
    VALUES
      (
        'parent',
        $1,
        $2,
        CURRENT_TIMESTAMP
          + INTERVAL '15 minutes'
      ),
      (
        'parent',
        $3,
        $4,
        CURRENT_TIMESTAMP
          + INTERVAL '15 minutes'
      );
    `,
    [
      parentId,
      "b".repeat(64),
      otherParentId,
      "c".repeat(64),
    ],
  );

  await pool.query(
    `
    INSERT INTO two_factor_recovery_codes (
      account_type,
      account_id,
      code_hash
    )
    VALUES
      (
        'parent',
        $1,
        $2
      ),
      (
        'parent',
        $3,
        $4
      );
    `,
    [
      parentId,
      "d".repeat(64),
      otherParentId,
      "e".repeat(64),
    ],
  );
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE
      two_factor_recovery_codes,
      password_reset_tokens,
      parent_email_verification_codes,
      parent_children,
      link_codes,
      users,
      parents
    RESTART IDENTITY
    CASCADE;
  `);

  await pool.end();
});

test(
  "unauthenticated request cannot delete parent account",
  async () => {
    const response = await request(app)
      .delete("/api/parent/me")
      .send({
        password: PARENT_PASSWORD,
      })
      .expect(401);

    assert.equal(
      response.body.success,
      false,
    );

    const parentResult =
      await pool.query(
        `
        SELECT id
        FROM parents
        WHERE id = $1;
        `,
        [parentId],
      );

    assert.equal(
      parentResult.rows.length,
      1,
    );
  },
);

test(
  "parent deletion requires password",
  async () => {
    const agent = request.agent(app);

    await loginParent(agent);

    const response = await agent
      .delete("/api/parent/me")
      .send({})
      .expect(400);

    assert.equal(
      response.body.success,
      false,
    );

    const parentResult =
      await pool.query(
        `
        SELECT id
        FROM parents
        WHERE id = $1;
        `,
        [parentId],
      );

    assert.equal(
      parentResult.rows.length,
      1,
    );
  },
);

test(
  "wrong password does not delete parent account",
  async () => {
    const agent = request.agent(app);

    await loginParent(agent);

    const response = await agent
      .delete("/api/parent/me")
      .send({
        password: WRONG_PASSWORD,
      })
      .expect(401);

    assert.equal(
      response.body.success,
      false,
    );

    assert.equal(
      response.body.message,
      "Invalid password",
    );

    const parentResult =
      await pool.query(
        `
        SELECT id
        FROM parents
        WHERE id = $1;
        `,
        [parentId],
      );

    assert.equal(
      parentResult.rows.length,
      1,
    );

    const relationResult =
      await pool.query(
        `
        SELECT id
        FROM parent_children
        WHERE parent_id = $1
          AND child_id = $2;
        `,
        [
          parentId,
          childId,
        ],
      );

    assert.equal(
      relationResult.rows.length,
      1,
    );
  },
);

test(
  "valid password deletes parent data but preserves child and unrelated parent",
  async () => {
    const agent = request.agent(app);

    await loginParent(agent);

    const response = await agent
      .delete("/api/parent/me")
      .send({
        password: PARENT_PASSWORD,
      })
      .expect(200);

    assert.equal(
      response.body.success,
      true,
    );

    assert.equal(
      response.body.message,
      "Account deleted successfully",
    );

    const parentResult =
      await pool.query(
        `
        SELECT id
        FROM parents
        WHERE id = $1;
        `,
        [parentId],
      );

    assert.equal(
      parentResult.rows.length,
      0,
    );

    const childResult =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE id = $1;
        `,
        [childId],
      );

    assert.equal(
      childResult.rows.length,
      1,
    );

    const relationResult =
      await pool.query(
        `
        SELECT id
        FROM parent_children
        WHERE parent_id = $1;
        `,
        [parentId],
      );

    assert.equal(
      relationResult.rows.length,
      0,
    );

    const linkCodeResult =
      await pool.query(
        `
        SELECT code
        FROM link_codes
        WHERE parent_id = $1;
        `,
        [parentId],
      );

    assert.equal(
      linkCodeResult.rows.length,
      0,
    );

    const verificationResult =
      await pool.query(
        `
        SELECT id
        FROM parent_email_verification_codes
        WHERE parent_id = $1;
        `,
        [parentId],
      );

    assert.equal(
      verificationResult.rows.length,
      0,
    );

    const resetTokenResult =
      await pool.query(
        `
        SELECT id
        FROM password_reset_tokens
        WHERE account_type = 'parent'
          AND account_id = $1;
        `,
        [parentId],
      );

    assert.equal(
      resetTokenResult.rows.length,
      0,
    );

    const recoveryResult =
      await pool.query(
        `
        SELECT id
        FROM two_factor_recovery_codes
        WHERE account_type = 'parent'
          AND account_id = $1;
        `,
        [parentId],
      );

    assert.equal(
      recoveryResult.rows.length,
      0,
    );

    const otherParentResult =
      await pool.query(
        `
        SELECT id
        FROM parents
        WHERE id = $1;
        `,
        [otherParentId],
      );

    assert.equal(
      otherParentResult.rows.length,
      1,
    );

    const otherLinkResult =
      await pool.query(
        `
        SELECT code
        FROM link_codes
        WHERE parent_id = $1;
        `,
        [otherParentId],
      );

    assert.equal(
      otherLinkResult.rows.length,
      1,
    );

    const otherResetResult =
      await pool.query(
        `
        SELECT id
        FROM password_reset_tokens
        WHERE account_type = 'parent'
          AND account_id = $1;
        `,
        [otherParentId],
      );

    assert.equal(
      otherResetResult.rows.length,
      1,
    );

    const otherRecoveryResult =
      await pool.query(
        `
        SELECT id
        FROM two_factor_recovery_codes
        WHERE account_type = 'parent'
          AND account_id = $1;
        `,
        [otherParentId],
      );

    assert.equal(
      otherRecoveryResult.rows.length,
      1,
    );

    const cookies =
      response.headers["set-cookie"] || [];

    assert.ok(
      cookies.some(
        (cookie) =>
          cookie.startsWith(
            "parentAccessToken=",
          ),
      ),
    );

    assert.ok(
      cookies.some(
        (cookie) =>
          cookie.startsWith(
            "parentRefreshToken=",
          ),
      ),
    );

    assert.ok(
      cookies.some(
        (cookie) =>
          cookie.startsWith(
            "parentTwoFactorChallenge=",
          ),
      ),
    );

    await agent
      .get("/api/parent/me")
      .expect(401);
  },
);