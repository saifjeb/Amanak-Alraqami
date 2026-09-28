import { Pool } from "pg";
import { logger, serializeError } from "../Utils/logger.js";

const connectionString = process.env.CONNECTION_STRING;
if (!connectionString) {
  throw new Error("CONNECTION_STRING is not configured");
}

let databaseName = "";
try {
  const databaseUrl = new URL(connectionString);
  databaseName = databaseUrl.pathname.replace(/^\//, "").split("?")[0];
} catch {
  throw new Error("Invalid CONNECTION_STRING");
}

if (
  process.env.NODE_ENV === "test" &&
  databaseName !== "amanak_alraqami_test"
) {
  throw new Error(
    "Tests must use amanak_alraqami_test. Refusing to connect to another database.",
  );
}

if (
  process.env.NODE_ENV === "production" &&
  databaseName === "amanak_alraqami_test"
) {
  throw new Error("Production must not use amanak_alraqami_test.");
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
  allowExitOnIdle: process.env.NODE_ENV === "test",
});

pool.on("error", (error) => {
  logger.error("database.pool_error", {
    error: serializeError(error),
  });
});

export default pool;