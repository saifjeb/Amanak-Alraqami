import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test(
  "server adds a generated request ID to responses",
  async () => {
    const response =
      await request(app)
        .get("/health");

    assert.equal(
      response.status,
      200,
    );

    const requestId =
      response.headers[
        "x-request-id"
      ];

    assert.equal(
      typeof requestId,
      "string",
    );

    assert.match(
      requestId,
      UUID_PATTERN,
    );
  },
);

test(
  "server does not trust a client-supplied request ID",
  async () => {
    const suppliedId =
      "client-controlled-id";

    const firstResponse =
      await request(app)
        .get("/health")
        .set(
          "X-Request-Id",
          suppliedId,
        );

    const secondResponse =
      await request(app)
        .get("/health");

    const firstId =
      firstResponse.headers[
        "x-request-id"
      ];

    const secondId =
      secondResponse.headers[
        "x-request-id"
      ];

    assert.match(
      firstId,
      UUID_PATTERN,
    );

    assert.match(
      secondId,
      UUID_PATTERN,
    );

    assert.notEqual(
      firstId,
      suppliedId,
    );

    assert.notEqual(
      firstId,
      secondId,
    );
  },
);