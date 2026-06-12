import type { FastifyPluginAsync } from "fastify";
import type { HealthResponse } from "@qdialer/shared";
import type { AppConfig } from "../config/env.js";

export const healthRoutes: FastifyPluginAsync<{ config: AppConfig }> = async (app, options) => {
  app.get("/health", async (): Promise<HealthResponse> => ({
    ok: true,
    service: "qdialer-api",
    mode: options.config.QDIALER_MODE,
    generatedAt: new Date().toISOString()
  }));
};
