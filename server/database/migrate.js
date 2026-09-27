import "dotenv/config";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pool from "../src/config/db.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const migrationsDirectory = path.join(__dirname, "migrations");

const schemaPath = path.join(__dirname, "..", "scheme.sql");

const BASELINE_NAME = "000_initial_schema.sql";

const statusOnly = process.argv.includes("--status");

function checksum(sql) {
  return crypto.createHash("sha256").update(sql, "utf8").digest("hex");
}

function stripOuterTransaction(sql) {
  let body = sql.trim();

  const hasBegin = /^BEGIN;\s*/i.test(body);

  const hasCommit = /\s*COMMIT;\s*$/i.test(body);

  if (hasBegin && hasCommit) {
    body = body
      .replace(/^BEGIN;\s*/i, "")
      .replace(/\s*COMMIT;\s*$/i, "")
      .trim();
  }

  return body;
}

function extractBaseTables(sql) {
  const tables = [];

  const regex =
    /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:"?public"?\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?/gi;

  let match;

  while ((match = regex.exec(sql)) !== null) {
    tables.push(match[1]);
  }

  return [...new Set(tables)];
}

async function relationExists(client, relationName) {
  const result = await client.query(
    `
      SELECT
        to_regclass($1) AS relation
      `,
    [`public.${relationName}`],
  );

  return Boolean(result.rows[0]?.relation);
}

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS
    schema_migrations (
      filename TEXT PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(`
      SELECT
        filename,
        checksum,
        applied_at
      FROM schema_migrations
      ORDER BY filename ASC;
    `);

  return new Map(result.rows.map((row) => [row.filename, row]));
}

async function applyMigration({ client, filename, sql, applied }) {
  const sqlChecksum = checksum(sql);

  const existing = applied.get(filename);

  if (existing) {
    if (existing.checksum !== sqlChecksum) {
      throw new Error(`Migration checksum mismatch: ${filename}`);
    }

    console.log(`✓ already applied: ${filename}`);

    return;
  }

  const body = stripOuterTransaction(sql);

  await client.query("BEGIN");

  try {
    if (body) {
      await client.query(body);
    }

    await client.query(
      `
      INSERT INTO schema_migrations (
        filename,
        checksum
      )
      VALUES ($1, $2);
      `,
      [filename, sqlChecksum],
    );

    await client.query("COMMIT");

    applied.set(filename, {
      filename,
      checksum: sqlChecksum,
    });

    console.log(`✓ applied: ${filename}`);
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  }
}

async function initializeBaseline(client, applied) {
  const schemaSql = await fs.readFile(schemaPath, "utf8");

  const schemaChecksum = checksum(schemaSql);

  const existing = applied.get(BASELINE_NAME);

  if (existing) {
    if (existing.checksum !== schemaChecksum) {
      throw new Error(
        "Initial schema checksum has changed after being recorded.",
      );
    }

    console.log(`✓ already applied: ${BASELINE_NAME}`);

    return;
  }

  const expectedTables = extractBaseTables(schemaSql);

  if (expectedTables.length === 0) {
    throw new Error("No CREATE TABLE statements were found in scheme.sql.");
  }

  const existingTables = [];

  for (const tableName of expectedTables) {
    if (await relationExists(client, tableName)) {
      existingTables.push(tableName);
    }
  }

  /*
   * Completely fresh database:
   * execute scheme.sql.
   */
  if (existingTables.length === 0) {
    await applyMigration({
      client,
      filename: BASELINE_NAME,
      sql: schemaSql,
      applied,
    });

    return;
  }

  /*
   * Existing development database:
   * all original tables must exist.
   */
  if (existingTables.length !== expectedTables.length) {
    const missingTables = expectedTables.filter(
      (tableName) => !existingTables.includes(tableName),
    );

    throw new Error(
      `Partial base schema detected. Missing tables: ${missingTables.join(", ")}`,
    );
  }

  /*
   * Existing complete schema:
   * record the initial schema as
   * the baseline without rerunning
   * the CREATE TABLE / seed script.
   */
  await client.query("BEGIN");

  try {
    await client.query(
      `
      INSERT INTO schema_migrations (
        filename,
        checksum
      )
      VALUES ($1, $2);
      `,
      [BASELINE_NAME, schemaChecksum],
    );

    await client.query("COMMIT");

    applied.set(BASELINE_NAME, {
      filename: BASELINE_NAME,
      checksum: schemaChecksum,
    });

    console.log(`✓ baseline recorded: ${BASELINE_NAME}`);
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  }
}

async function getMigrationFiles() {
  const entries = await fs.readdir(migrationsDirectory, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function showStatus(client) {
  const trackingExists = await relationExists(client, "schema_migrations");

  if (!trackingExists) {
    console.log("schema_migrations has not been initialized yet.");

    return;
  }

  const applied = await getAppliedMigrations(client);

  const schemaSql = await fs.readFile(schemaPath, "utf8");

  const files = await getMigrationFiles();

  const migrations = [
    {
      filename: BASELINE_NAME,
      sql: schemaSql,
    },
  ];

  for (const filename of files) {
    const sql = await fs.readFile(
      path.join(migrationsDirectory, filename),
      "utf8",
    );

    migrations.push({
      filename,
      sql,
    });
  }

  for (const migration of migrations) {
    const existing = applied.get(migration.filename);

    if (!existing) {
      console.log(`○ pending: ${migration.filename}`);

      continue;
    }

    const currentChecksum = checksum(migration.sql);

    if (existing.checksum !== currentChecksum) {
      console.log(`! changed: ${migration.filename}`);

      continue;
    }

    console.log(`✓ applied: ${migration.filename}`);
  }
}

async function run() {
  const client = await pool.connect();

  try {
    if (statusOnly) {
      await showStatus(client);
      return;
    }

    await ensureTrackingTable(client);

    const applied = await getAppliedMigrations(client);

    await initializeBaseline(client, applied);

    const migrationFiles = await getMigrationFiles();

    for (const filename of migrationFiles) {
      const filePath = path.join(migrationsDirectory, filename);

      const sql = await fs.readFile(filePath, "utf8");

      await applyMigration({
        client,
        filename,
        sql,
        applied,
      });
    }

    console.log("\nDatabase migrations complete.");
  } finally {
    client.release();

    await pool.end();
  }
}

run().catch((error) => {
  console.error("\nMigration failed:", error.message);

  process.exitCode = 1;
});
