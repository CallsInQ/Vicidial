import { Pool } from "pg";
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
