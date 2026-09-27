import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";

test("health endpoint returns service status", async () => {
  const response = await request(app)
    .get("/health")
    .expect(200);

  assert.equal(
    response.body.success,
    true,
  );

  assert.equal(
    response.body.status,
    "ok",
  );
});
