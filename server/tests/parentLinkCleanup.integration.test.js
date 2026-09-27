import test, {
  before,
  beforeEach,
  after,
} from "node:test";

import assert from "node:assert/strict";

import pool from "../src/config/db.js";

import {
  createLinkCode,
  useLinkCode,
} from "../src/Model/parentLink.Model.js";

let parentId;
let otherParentId;
let childId;

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
      parent_children,
      link_codes,
      users,
      parents
    RESTART IDENTITY
    CASCADE;
  `);

  const parentsResult = await pool.query(
    `
    INSERT INTO parents (
      name,
      email,
      hashed_password
    )
    VALUES
      ($1, $2, $3),
      ($4, $5, $6)
    RETURNING
      id,
      email;
    `,
    [
      "Link Cleanup Parent",
      "link.cleanup.parent@example.com",
      "test-password-hash",
      "Other Link Parent",
      "other.link.parent@example.com",
      "test-password-hash",
    ],
  );

  parentId = parentsResult.rows.find(
    (row) =>
      row.email ===
      "link.cleanup.parent@example.com",
  ).id;

  otherParentId = parentsResult.rows.find(
    (row) =>
      row.email ===
      "other.link.parent@example.com",
  ).id;

  const childResult = await pool.query(
    `
    INSERT INTO users (
      nickname,
      hashed_password,
      age_group
    )
    VALUES ($1, $2, $3)
    RETURNING id;
    `,
    [
      "LinkCleanupChild",
      "test-password-hash",
      "8-10",
    ],
  );

  childId = childResult.rows[0].id;
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE
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
  "creating a link code removes expired and used codes while preserving unrelated active codes",
  async () => {
    await pool.query(
      `
      INSERT INTO link_codes (
        code,
        parent_id,
        expires_at,
        used_at
      )
      VALUES
        (
          '111111',
          $1,
          CURRENT_TIMESTAMP - INTERVAL '5 minutes',
          NULL
        ),
        (
          '222222',
          $1,
          CURRENT_TIMESTAMP + INTERVAL '10 minutes',
          CURRENT_TIMESTAMP
        ),
        (
          '333333',
          $2,
          CURRENT_TIMESTAMP + INTERVAL '10 minutes',
          NULL
        );
      `,
      [parentId, otherParentId],
    );

    const created = await createLinkCode(
      parentId,
      "444444",
    );

    assert.equal(created.code, "444444");

    const codesResult = await pool.query(`
      SELECT code
      FROM link_codes
      ORDER BY code;
    `);

    assert.deepEqual(
      codesResult.rows.map((row) => row.code),
      ["333333", "444444"],
    );
  },
);

test(
  "using a link code links the child and removes the consumed code",
  async () => {
    await pool.query(
      `
      INSERT INTO link_codes (
        code,
        parent_id,
        expires_at
      )
      VALUES (
        '333333',
        $1,
        CURRENT_TIMESTAMP + INTERVAL '10 minutes'
      );
      `,
      [otherParentId],
    );

    await createLinkCode(
      parentId,
      "555555",
    );

    const result = await useLinkCode(
      "555555",
      childId,
    );

    assert.equal(result.success, true);

    const relationResult = await pool.query(
      `
      SELECT
        parent_id,
        child_id
      FROM parent_children
      WHERE parent_id = $1
        AND child_id = $2;
      `,
      [parentId, childId],
    );

    assert.equal(
      relationResult.rows.length,
      1,
    );

    const consumedCodeResult = await pool.query(
      `
      SELECT code
      FROM link_codes
      WHERE code = $1;
      `,
      ["555555"],
    );

    assert.equal(
      consumedCodeResult.rows.length,
      0,
    );

    const unrelatedActiveCodeResult =
      await pool.query(
        `
        SELECT code
        FROM link_codes
        WHERE code = $1;
        `,
        ["333333"],
      );

    assert.equal(
      unrelatedActiveCodeResult.rows.length,
      1,
    );
  },
);