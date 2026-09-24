import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";

test("unknown route returns 404 JSON", async () => {
  const response = await request(app)
    .get("/api/route-that-does-not-exist")
    .expect(404);

  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Route not found");
});