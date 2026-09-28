import "dotenv/config";
import app from "./src/app.js";
import pool from "./src/config/db.js";
import { logger, serializeError } from "./src/Utils/logger.js";

const rawPort = process.env.PORT;
const PORT = rawPort === undefined ? 3000 : Number(rawPort);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  logger.error("server.invalid_port", { configured_port: rawPort ?? null });
  process.exit(1);
}

let isShuttingDown = false;
const logFatalError = (
  event,
  error,
  fields = {},
) => {
  logger.error(event, {
    ...fields,
    error: serializeError(error),
  });
};

const server = app.listen(PORT, () => {
  logger.info("server.started", { port: PORT });
});

server.on("error", async (error) => {
  logFatalError("server.start_error", error);
  try {
    await pool.end();
  } catch (databaseError) {
    logFatalError("database.shutdown_error", databaseError);
  }

  process.exit(1);
});

const shutdown = (signal, exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info("server.shutdown_started", { signal });
  const forceShutdown = setTimeout(() => {
    logger.error("server.shutdown_forced", { timeout_ms: 10000 });
    process.exit(1);
  }, 10000);

  forceShutdown.unref();
  server.close(async (serverError) => {
    if (serverError) {
      logFatalError("server.shutdown_error", serverError);
    }

    try {
      await pool.end();
    } catch (databaseError) {
      logFatalError("database.shutdown_error", databaseError);
      clearTimeout(forceShutdown);
      process.exit(1);
      return;
    }

    clearTimeout(forceShutdown);
    logger.info("server.shutdown_complete", { signal });
    process.exit(serverError ? 1 : exitCode);
  });
};

process.on("SIGTERM", () => {
  shutdown("SIGTERM", 0);
});
process.on("SIGINT", () => {
  shutdown("SIGINT", 0);
});

process.on("unhandledRejection", (reason) => {
  logFatalError("process.unhandled_rejection", reason);
  shutdown("UNHANDLED_REJECTION", 1);
});

process.on("uncaughtException", (error) => {
  logFatalError("process.uncaught_exception", error);
  shutdown("UNCAUGHT_EXCEPTION", 1);
});

export default server;