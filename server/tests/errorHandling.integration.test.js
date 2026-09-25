import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";
test("unknown route returns safe 404 JSON", async () => {
  const response = await request(app)
    .get("/api/this-route-does-not-exist")
    .expect(404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Route not found");
});

test("malformed JSON body returns 400 without exposing internal error", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send('{"nickname":"test",')
    .expect(400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Invalid JSON body");
  assert.equal(response.body.stack, undefined);
});

test("request body larger than 1 MB is rejected", async () => {
  const oversizedValue = "A".repeat(1024 * 1024 + 1000);
  const response = await request(app)
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send(
      JSON.stringify({
        nickname: oversizedValue,
        password: "Password123!",
      }),
    )
    .expect(413);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Request body too large");
});

test("validation failure returns controlled 400 response", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({})
    .expect(400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Validation failed");
  assert.ok(Array.isArray(response.body.errors));
  assert.ok(response.body.errors.length > 0);
});

test("validation response does not expose technical internals", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      unexpected: "should not matter",
    })
    .expect(400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.stack, undefined);
  assert.equal(response.body.sql, undefined);
  assert.equal(response.body.query, undefined);
});