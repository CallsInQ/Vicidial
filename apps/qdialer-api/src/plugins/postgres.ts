import { Pool } from "pg";
import type { DependencyHealth } from "@qdialer/shared";
import type { AppConfig } from "../config/env.js";

export function createQdialerPool(config: AppConfig): Pool | null {
  if (!config.DATABASE_URL) {
    return null;
  }

  return new Pool({
    connectionString: config.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000
  });
}

export async function checkPostgres(pool: Pool | null): Promise<DependencyHealth> {
  if (!pool) {
    return { configured: false, ok: false, detail: "DATABASE_URL is not configured" };
  }

  try {
    await pool.query("SELECT 1");
    return { configured: true, ok: true };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      detail: error instanceof Error ? error.message : "Postgres health check failed"
    };
  }
}
