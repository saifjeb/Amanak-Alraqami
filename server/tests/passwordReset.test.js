import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";

test(
  "parent forgot password rejects missing email",
  async () => {
    const response = await request(app)
      .post("/api/parent/forgot-password")
      .send({})
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Please enter a valid email address."
    );
  }
);

test(
  "parent forgot password rejects invalid email",
  async () => {
    const response = await request(app)
      .post("/api/parent/forgot-password")
      .send({
        email: "invalid-email",
      })
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Please enter a valid email address."
    );
  }
);

test(
  "admin forgot password rejects missing email",
  async () => {
    const response = await request(app)
      .post("/api/admin/forgot-password")
      .send({})
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Please enter a valid email address."
    );
  }
);

test(
  "admin forgot password rejects invalid email",
  async () => {
    const response = await request(app)
      .post("/api/admin/forgot-password")
      .send({
        email: "invalid-email",
      })
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Please enter a valid email address."
    );
  }
);

test(
  "parent reset password rejects missing token",
  async () => {
    const response = await request(app)
      .post("/api/parent/reset-password")
      .send({
        password: "StrongPassword123!",
      })
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Password reset token is required."
    );
  }
);

test(
  "admin reset password rejects missing token",
  async () => {
    const response = await request(app)
      .post("/api/admin/reset-password")
      .send({
        password: "StrongPassword123!",
      })
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Password reset token is required."
    );
  }
);

test(
  "parent reset password rejects invalid token format",
  async () => {
    const response = await request(app)
      .post("/api/parent/reset-password")
      .send({
        token: "invalid-token",
        password: "StrongPassword123!",
      })
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Invalid or expired password reset link."
    );
  }
);

test(
  "admin reset password rejects invalid token format",
  async () => {
    const response = await request(app)
      .post("/api/admin/reset-password")
      .send({
        token: "invalid-token",
        password: "StrongPassword123!",
      })
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Invalid or expired password reset link."
    );
  }
);

test(
  "parent reset password rejects short password",
  async () => {
    const token = "a".repeat(64);

    const response = await request(app)
      .post("/api/parent/reset-password")
      .send({
        token,
        password: "123",
      })
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Password must be at least 8 characters."
    );
  }
);

test(
  "admin reset password rejects short password",
  async () => {
    const token = "a".repeat(64);

    const response = await request(app)
      .post("/api/admin/reset-password")
      .send({
        token,
        password: "123",
      })
      .expect(400);

    assert.equal(response.body.success, false);

    assert.equal(
      response.body.message,
      "Password must be at least 8 characters."
    );
  }
);