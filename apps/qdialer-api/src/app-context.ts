import type { Pool } from "pg";
import type { Redis } from "ioredis";
import type { DependencyHealth } from "@qdialer/shared";
import type { AppConfig } from "./config/env.js";
import { VicidialApiClient } from "./connectors/vicidial-api.js";
import { VicidialReadonlyDb } from "./connectors/vicidial-db.js";
import { checkPostgres, createQdialerPool } from "./plugins/postgres.js";
import { checkRedis, createRedisClient } from "./plugins/redis.js";

export type QdialerAppContext = {
  config: AppConfig;
  qdialerPool: Pool | null;
  redis: Redis | null;
  vicidialDb: VicidialReadonlyDb;
  vicidialApi: VicidialApiClient;
};

export type QdialerDependencyHealth = {
  postgres: DependencyHealth;
  redis: DependencyHealth;
  vicidialDb: DependencyHealth;
  vicidialApi: DependencyHealth;
};

export function createAppContext(config: AppConfig): QdialerAppContext {
  return {
    config,
    qdialerPool: createQdialerPool(config),
    redis: createRedisClient(config),
    vicidialDb: new VicidialReadonlyDb(config),
    vicidialApi: new VicidialApiClient(config)
  };
}

export async function checkDependencies(context: QdialerAppContext): Promise<QdialerDependencyHealth> {
  const [postgres, redis, vicidialDb] = await Promise.all([
    checkPostgres(context.qdialerPool),
    checkRedis(context.redis),
    context.vicidialDb.checkConnection()
  ]);

  return {
    postgres,
    redis,
    vicidialDb,
    vicidialApi: context.vicidialApi.health()
  };
}

export async function closeAppContext(context: QdialerAppContext): Promise<void> {
  await Promise.all([
    context.qdialerPool?.end(),
    context.redis?.quit().catch(() => context.redis?.disconnect())
  ]);
}
