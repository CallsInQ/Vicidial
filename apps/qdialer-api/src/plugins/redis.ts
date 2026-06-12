import { Redis } from "ioredis";
import type { DependencyHealth } from "@qdialer/shared";
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

export async function checkRedis(redis: Redis | null): Promise<DependencyHealth> {
  if (!redis) {
    return { configured: false, ok: false, detail: "REDIS_URL is not configured" };
  }

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    const pong = await redis.ping();
    return { configured: true, ok: pong === "PONG", detail: pong };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      detail: error instanceof Error ? error.message : "Redis health check failed"
    };
  }
}
