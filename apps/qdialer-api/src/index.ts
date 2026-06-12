import cors from "@fastify/cors";
import Fastify from "fastify";
import { config } from "./config/env.js";
import { VicidialApiClient } from "./connectors/vicidial-api.js";
import { VicidialReadonlyDb } from "./connectors/vicidial-db.js";
import { createQdialerPool } from "./plugins/postgres.js";
import { createRedisClient } from "./plugins/redis.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { healthRoutes } from "./routes/health.js";
import { realtimeRoutes } from "./routes/realtime.js";
import { vendorRoutes } from "./routes/vendors.js";

const app = Fastify({
  logger: {
    level: config.NODE_ENV === "production" ? "info" : "debug"
  }
});

const qdialerPool = createQdialerPool(config);
const redis = createRedisClient(config);
const vicidialDb = new VicidialReadonlyDb(config);
const vicidialApi = new VicidialApiClient(config);

app.decorate("qdialer", {
  qdialerPool,
  redis,
  vicidialDb,
  vicidialApi
});

await app.register(cors, {
  origin: true,
  credentials: true
});

await app.register(healthRoutes, { prefix: "/api/v1", config });
await app.register(dashboardRoutes, { prefix: "/api/v1", config });
await app.register(realtimeRoutes, { prefix: "/api/v1", config });
await app.register(vendorRoutes, { prefix: "/api/v1", config });

const address = await app.listen({
  host: config.QDIALER_API_HOST,
  port: config.QDIALER_API_PORT
});

app.log.info(
  {
    address,
    mode: config.QDIALER_MODE,
    hasPostgres: Boolean(qdialerPool),
    hasRedis: Boolean(redis),
    hasVicidialDb: vicidialDb.configured,
    hasVicidialApi: vicidialApi.configured
  },
  "qDialer API started"
);
