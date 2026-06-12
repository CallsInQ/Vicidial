import type { FastifyPluginAsync } from "fastify";
import type { HealthResponse } from "@qdialer/shared";
import type { AppConfig } from "../config/env.js";
import type { QdialerAppContext } from "../app-context.js";
import { checkDependencies } from "../app-context.js";

type HealthRouteOptions = {
  config: AppConfig;
  context: QdialerAppContext;
};

export const healthRoutes: FastifyPluginAsync<HealthRouteOptions> = async (app, options) => {
  app.get("/health", async (): Promise<HealthResponse> => {
    const dependencies = await checkDependencies(options.context);

    return {
      ok: dependencies.postgres.ok && dependencies.redis.ok,
      service: "qdialer-api",
      mode: options.config.QDIALER_MODE,
      generatedAt: new Date().toISOString(),
      dependencies
    };
  });
};
