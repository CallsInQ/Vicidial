import type { FastifyPluginAsync } from "fastify";
import type { DashboardSnapshot } from "@qdialer/shared";
import type { AppConfig } from "../config/env.js";
import { createMockDashboardSnapshot } from "../mock/snapshot.js";

export const dashboardRoutes: FastifyPluginAsync<{ config: AppConfig }> = async (app) => {
  app.get("/dashboard/snapshot", async (): Promise<DashboardSnapshot> => {
    return createMockDashboardSnapshot();
  });
};
