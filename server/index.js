import "dotenv/config";
import app from "./src/app.js";
import pool from "./src/config/db.js";

const isProd = process.env.NODE_ENV === "production";
const rawPort = process.env.PORT;
const PORT = rawPort === undefined ? 3000 : Number(rawPort);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error("Server configuration error: invalid PORT");
  process.exit(1);
}

let isShuttingDown = false;
const logFatalError = (label, error) => {
  if (isProd) {
    console.error(label, {
      name: error?.name || "Error",
      code: error?.code || null,
    });

    return;
  }
  console.error(label, error);
};

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on("error", async (error) => {
  logFatalError("Server failed to start:", error);
  try {
    await pool.end();
  } catch (databaseError) {
    logFatalError("Database shutdown error:", databaseError);
  }

  process.exit(1);
});

const shutdown = (signal, exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down safely...`);
  const forceShutdown = setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);

  forceShutdown.unref();
  server.close(async (serverError) => {
    if (serverError) {
      logFatalError("Server shutdown error:", serverError);
    }

    try {
      await pool.end();
    } catch (databaseError) {
      logFatalError("Database shutdown error:", databaseError);
      clearTimeout(forceShutdown);
      process.exit(1);
      return;
    }

    clearTimeout(forceShutdown);
    console.log("Server shutdown complete");
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
  logFatalError("Unhandled promise rejection:", reason);
  shutdown("UNHANDLED_REJECTION", 1);
});

process.on("uncaughtException", (error) => {
  logFatalError("Uncaught exception:", error);
  shutdown("UNCAUGHT_EXCEPTION", 1);
});

export default server;