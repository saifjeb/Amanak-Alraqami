import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

/*
 * Production security middleware test.
 *
 * We intentionally switch the app to production
 * mode, but we do NOT use the real production DB.
 *
 * These tests only exercise middleware and a
 * nonexistent route, so no database query should
 * occur.
 */
process.env.NODE_ENV = "production";

process.env.CLIENT_URL = "https://app.amanak-test.example";

/*
 * Prevent the production DB safety guard from
 * rejecting the normal test database name.
 *
 * This is intentionally a fake DB URL.
 * No connection should be made by these tests.
 */
process.env.CONNECTION_STRING =
  "postgresql://fake:fake@127.0.0.1:5432/amanak_production_security_test";

const { default: app } = await import("../src/app.js");

const allowedOrigin = "https://app.amanak-test.example";

const foreignOrigin = "https://evil.example";

test("production enables trust proxy", () => {
  assert.equal(app.get("trust proxy"), 1);
});

test("production allows state-changing request from configured frontend origin", async () => {
  const response = await request(app)
    .post("/api/security-origin-test")
    .set("Origin", allowedOrigin)
    .send({
      test: true,
    })
    .expect(404);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Route not found");
});

test("production rejects state-changing request from foreign origin", async () => {
  const response = await request(app)
    .post("/api/security-origin-test")
    .set("Origin", foreignOrigin)
    .send({
      test: true,
    })
    .expect(403);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Invalid request origin");
});

test("production rejects state-changing request with missing Origin", async () => {
  const response = await request(app)
    .post("/api/security-origin-test")
    .send({
      test: true,
    })
    .expect(403);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Invalid request origin");
});

test("production does not apply Origin protection to safe GET requests", async () => {
  const response = await request(app)
    .get("/api/security-origin-test")
    .set("Origin", foreignOrigin)
    .expect(404);

  assert.equal(response.body.success, false);

  assert.equal(response.body.message, "Route not found");
});
