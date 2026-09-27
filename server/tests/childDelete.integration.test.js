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

const CHILD_NICKNAME =
  "DeleteChildTest";

const OTHER_CHILD_NICKNAME =
  "KeepChildTest";

const CHILD_PASSWORD =
  "DeleteChildPassword123!";

const WRONG_PASSWORD =
  "WrongChildPassword123!";

let childId;
let otherChildId;
let parentId;

function getCookieValue(response, cookieName) {
  const cookies =
    response.headers["set-cookie"] || [];

  const cookie = cookies.find(
    (item) =>
      item.startsWith(
        `${cookieName}=`,
      ),
  );

  if (!cookie) {
    return null;
  }

  return cookie
    .split(";")[0]
    .substring(
      `${cookieName}=`.length,
    );
}

async function loginChild(agent) {
  const response = await agent
    .post("/api/auth/login")
    .send({
      nickname: CHILD_NICKNAME,
      password: CHILD_PASSWORD,
    })
    .expect(200);

  assert.equal(
    response.body.success,
    true,
  );

  return response;
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
      parent_children,
      question_attempts,
      attempts,
      progress,
      user_badges,
      users,
      parents
    RESTART IDENTITY
    CASCADE;
  `);

  const passwordHash =
    await bcrypt.hash(
      CHILD_PASSWORD,
      10,
    );

  const usersResult =
    await pool.query(
      `
      INSERT INTO users (
        nickname,
        hashed_password,
        age_group,
        avatar
      )
      VALUES
        (
          $1,
          $2,
          '8-10',
          'avatar1'
        ),
        (
          $3,
          $4,
          '11-14',
          'avatar1'
        )
      RETURNING
        id,
        nickname;
      `,
      [
        CHILD_NICKNAME,
        passwordHash,
        OTHER_CHILD_NICKNAME,
        passwordHash,
      ],
    );

  childId =
    usersResult.rows.find(
      (row) =>
        row.nickname ===
        CHILD_NICKNAME,
    ).id;

  otherChildId =
    usersResult.rows.find(
      (row) =>
        row.nickname ===
        OTHER_CHILD_NICKNAME,
    ).id;

  const parentResult =
    await pool.query(
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
      [
        "Child Delete Parent",
        "child.delete.parent@example.com",
        "parent-password-hash",
      ],
    );

  parentId =
    parentResult.rows[0].id;

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
    DELETE FROM adventures
    WHERE title_en = $1;
    `,
    ["Child Delete Fixture Adventure"],
  );

  await pool.query(
    `
    DELETE FROM badges
    WHERE name = $1;
    `,
    ["child_delete_fixture_badge"],
  );

  const adventureResult =
    await pool.query(
      `
      INSERT INTO adventures (
        title_ar,
        title_en,
        display_order
      )
      VALUES (
        $1,
        $2,
        $3
      )
      RETURNING id;
      `,
      [
        "Child Delete Fixture",
        "Child Delete Fixture Adventure",
        999,
      ],
    );

  const adventureId =
    adventureResult.rows[0].id;

  const questionResult =
    await pool.query(
      `
      INSERT INTO questions (
        adventure_id,
        question_type,
        age_group,
        question_ar,
        option_a_ar,
        option_b_ar,
        option_c_ar,
        correct_answer,
        display_order
      )
      VALUES (
        $1,
        'adventure',
        '8-10',
        $2,
        $3,
        $4,
        $5,
        'A',
        1
      )
      RETURNING id;
      `,
      [
        adventureId,
        "Fixture question",
        "Fixture answer A",
        "Fixture answer B",
        "Fixture answer C",
      ],
    );

  const questionId =
    questionResult.rows[0].id;

  const badgeResult =
    await pool.query(
      `
      INSERT INTO badges (
        name,
        title_ar,
        title_en
      )
      VALUES (
        $1,
        $2,
        $3
      )
      RETURNING id;
      `,
      [
        "child_delete_fixture_badge",
        "Child Delete Fixture Badge",
        "Child Delete Fixture Badge",
      ],
    );

  const badgeId =
    badgeResult.rows[0].id;

  await pool.query(
    `
    INSERT INTO question_attempts (
      user_id,
      question_id,
      selected_answer,
      is_correct,
      points_awarded
    )
    VALUES (
      $1,
      $2,
      'A',
      TRUE,
      10
    );
    `,
    [
      childId,
      questionId,
    ],
  );

  await pool.query(
    `
    INSERT INTO attempts (
      user_id,
      test_type,
      correct_answers,
      total_questions,
      score_percentage
    )
    VALUES
      (
        $1,
        'pre_test',
        1,
        1,
        100
      ),
      (
        $2,
        'pre_test',
        1,
        1,
        100
      );
    `,
    [
      childId,
      otherChildId,
    ],
  );

  await pool.query(
    `
    INSERT INTO progress (
      user_id,
      adventure_id,
      score,
      earned_points,
      completed
    )
    VALUES (
      $1,
      $2,
      100,
      10,
      TRUE
    );
    `,
    [
      childId,
      adventureId,
    ],
  );

  await pool.query(
    `
    INSERT INTO user_badges (
      user_id,
      badge_id
    )
    VALUES (
      $1,
      $2
    );
    `,
    [
      childId,
      badgeId,
    ],
  );
});

after(async () => {
  await pool.query(`
    TRUNCATE TABLE
      parent_children,
      question_attempts,
      attempts,
      progress,
      user_badges,
      users,
      parents
    RESTART IDENTITY
    CASCADE;
  `);

  await pool.query(
    `
    DELETE FROM adventures
    WHERE title_en = $1;
    `,
    ["Child Delete Fixture Adventure"],
  );

  await pool.query(
    `
    DELETE FROM badges
    WHERE name = $1;
    `,
    ["child_delete_fixture_badge"],
  );

  await pool.end();
});

test(
  "unauthenticated request cannot delete child account",
  async () => {
    const response = await request(app)
      .delete("/api/users/me")
      .send({
        password: CHILD_PASSWORD,
      })
      .expect(401);

    assert.equal(
      response.body.success,
      false,
    );

    const result =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE id = $1;
        `,
        [childId],
      );

    assert.equal(
      result.rows.length,
      1,
    );
  },
);

test(
  "child deletion requires password",
  async () => {
    const agent =
      request.agent(app);

    await loginChild(agent);

    const response = await agent
      .delete("/api/users/me")
      .send({})
      .expect(400);

    assert.equal(
      response.body.success,
      false,
    );

    const result =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE id = $1;
        `,
        [childId],
      );

    assert.equal(
      result.rows.length,
      1,
    );
  },
);

test(
  "wrong password does not delete child account",
  async () => {
    const agent =
      request.agent(app);

    await loginChild(agent);

    const response = await agent
      .delete("/api/users/me")
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

    const result =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE id = $1;
        `,
        [childId],
      );

    assert.equal(
      result.rows.length,
      1,
    );

    const relationResult =
      await pool.query(
        `
        SELECT id
        FROM parent_children
        WHERE child_id = $1;
        `,
        [childId],
      );

    assert.equal(
      relationResult.rows.length,
      1,
    );
  },
);

test(
  "valid password deletes child and cascades child data without deleting unrelated accounts",
  async () => {
    const agent =
      request.agent(app);

    const loginResponse =
      await loginChild(agent);

    const oldAccessToken =
      getCookieValue(
        loginResponse,
        "accessToken",
      );

    assert.ok(oldAccessToken);

    const response = await agent
      .delete("/api/users/me")
      .send({
        password: CHILD_PASSWORD,
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
      0,
    );

    for (
      const tableName of [
        "question_attempts",
        "attempts",
        "progress",
        "user_badges",
      ]
    ) {
      const dependentResult =
        await pool.query(
          `
          SELECT COUNT(*)::int AS count
          FROM ${tableName}
          WHERE user_id = $1;
          `,
          [childId],
        );

      assert.equal(
        dependentResult.rows[0].count,
        0,
      );
    }

    const relationResult =
      await pool.query(
        `
        SELECT id
        FROM parent_children
        WHERE child_id = $1;
        `,
        [childId],
      );

    assert.equal(
      relationResult.rows.length,
      0,
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

    const otherChildResult =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE id = $1;
        `,
        [otherChildId],
      );

    assert.equal(
      otherChildResult.rows.length,
      1,
    );

    const otherAttemptResult =
      await pool.query(
        `
        SELECT id
        FROM attempts
        WHERE user_id = $1;
        `,
        [otherChildId],
      );

    assert.equal(
      otherAttemptResult.rows.length,
      1,
    );

    const cookies =
      response.headers["set-cookie"] || [];

    assert.ok(
      cookies.some(
        (cookie) =>
          cookie.startsWith(
            "accessToken=",
          ),
      ),
    );

    assert.ok(
      cookies.some(
        (cookie) =>
          cookie.startsWith(
            "refreshToken=",
          ),
      ),
    );

    await agent
      .get("/api/auth/me")
      .expect(401);

    await request(app)
      .get("/api/auth/me")
      .set(
        "Cookie",
        `accessToken=${oldAccessToken}`,
      )
      .expect(401);
  },
);