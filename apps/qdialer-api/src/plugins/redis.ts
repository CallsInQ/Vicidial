import Redis from "ioredis";
import type { AppConfig } from "../config/env.js";

export function createRedisClient(config: AppConfig): Redis | null {
  if (!config.REDIS_URL) {
    return null;
  }

  return new Redis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });
}
