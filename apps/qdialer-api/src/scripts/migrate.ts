import fs from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { config } from "../config/env.js";

function findMigrationsDir(startDir: string, configuredPath: string): string {
  const candidates = [];

  if (path.isAbsolute(configuredPath)) {
    candidates.push(configuredPath);
  } else {
    candidates.push(path.resolve(startDir, configuredPath));
    candidates.push(path.resolve(startDir, "..", "..", configuredPath));
    candidates.push(path.resolve(startDir, "..", "..", "..", configuredPath));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Could not find qDialer migrations directory from ${startDir}`);
}

async function migrate() {
  if (!config.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run qDialer migrations.");
  }

  const migrationsDir = findMigrationsDir(process.cwd(), config.QDIALER_MIGRATIONS_DIR);
  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  const pool = new Pool({ connectionString: config.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS qdialer_schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    for (const filename of migrationFiles) {
      const existing = await client.query("SELECT filename FROM qdialer_schema_migrations WHERE filename = $1", [filename]);
      if (existing.rowCount) {
        console.log(`Skipping ${filename}`);
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, filename), "utf8");
      console.log(`Applying ${filename}`);
      await client.query(sql);
      await client.query("INSERT INTO qdialer_schema_migrations (filename) VALUES ($1)", [filename]);
    }

    console.log(`qDialer migrations complete (${migrationFiles.length} discovered).`);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
