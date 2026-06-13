import cors from "@fastify/cors";
import Fastify from "fastify";
import { closeAppContext, createAppContext } from "./app-context.js";
import { config } from "./config/env.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { healthRoutes } from "./routes/health.js";
import { realtimeRoutes } from "./routes/realtime.js";
import { vendorRoutes } from "./routes/vendors.js";

const app = Fastify({
  logger: {
    level: config.NODE_ENV === "production" ? "info" : "debug"
  }
});

const context = createAppContext(config);

await app.register(cors, {
  origin: true,
  credentials: true
});

await app.register(healthRoutes, { prefix: "/api/v1", config, context });
await app.register(dashboardRoutes, { prefix: "/api/v1", config, context });
await app.register(realtimeRoutes, { prefix: "/api/v1", config, context });
await app.register(vendorRoutes, { prefix: "/api/v1", config, context });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    app.log.info({ signal }, "qDialer API shutting down");
    await closeAppContext(context);
    await app.close();
    process.exit(0);
  });
}

const address = await app.listen({
  host: config.QDIALER_API_HOST,
  port: config.QDIALER_API_PORT
});

app.log.info(
  {
    address,
    mode: config.QDIALER_MODE,
    hasPostgres: Boolean(context.qdialerPool),
    hasRedis: Boolean(context.redis),
    hasVicidialDb: context.vicidialDb.configured,
    hasVicidialApi: context.vicidialApi.configured
  },
  "qDialer API started"
);
