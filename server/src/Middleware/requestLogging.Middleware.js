import { randomUUID } from "node:crypto";

import { logger } from "../Utils/logger.js";

const isTest =
  process.env.NODE_ENV === "test";

const getSafeRequestPath = (req) => {
  const rawPath =
    req.originalUrl ||
    req.url ||
    req.path ||
    "/";

  return rawPath.split("?")[0];
};

const getDurationMs = (startedAt) => {
  const elapsed =
    process.hrtime.bigint() -
    startedAt;

  return Number(
    (
      Number(elapsed) /
      1_000_000
    ).toFixed(2),
  );
};

export const requestLogging = (
  req,
  res,
  next,
) => {
  const requestId =
    randomUUID();

  req.requestId =
    requestId;

  res.setHeader(
    "X-Request-Id",
    requestId,
  );

  if (isTest) {
    return next();
  }

  const startedAt =
    process.hrtime.bigint();

  const requestPath =
    getSafeRequestPath(req);

  let logged = false;

  const writeRequestLog = ({
    event,
    aborted = false,
  }) => {
    if (logged) {
      return;
    }

    logged = true;

    const statusCode =
      res.statusCode;

    const fields = {
      request_id:
        requestId,

      method:
        req.method,

      path:
        requestPath,

      status_code:
        statusCode,

      duration_ms:
        getDurationMs(startedAt),
    };

    if (aborted) {
      fields.aborted = true;
    }

    if (
      aborted ||
      statusCode >= 500
    ) {
      logger.error(
        event,
        fields,
      );

      return;
    }

    if (statusCode >= 400) {
      logger.warn(
        event,
        fields,
      );

      return;
    }

    logger.info(
      event,
      fields,
    );
  };

  res.once(
    "finish",
    () => {
      writeRequestLog({
        event:
          "http.request",
      });
    },
  );

  res.once(
    "close",
    () => {
      if (!res.writableEnded) {
        writeRequestLog({
          event:
            "http.request_aborted",

          aborted: true,
        });
      }
    },
  );

  return next();
};