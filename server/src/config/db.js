import { Pool } from "pg";

const connectionString =
  process.env.CONNECTION_STRING;

if (!connectionString) {
  throw new Error(
    "CONNECTION_STRING is not configured"
  );
}

if (process.env.NODE_ENV === "test") {
  let databaseName = "";

  try {
    const databaseUrl =
      new URL(connectionString);

    databaseName =
      databaseUrl.pathname.replace(
        /^\//,
        ""
      );
  } catch {
    throw new Error(
      "Invalid test CONNECTION_STRING"
    );
  }

  if (databaseName !== "amanak_alraqami_test") {
    throw new Error(
      "Tests must use amanak_alraqami_test. Refusing to connect to another database."
    );
  }
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle:
    process.env.NODE_ENV === "test",
});

pool.on("error", (error) => {
  console.error(
    "Unexpected PostgreSQL pool error:",
    error
  );
});

export default pool;