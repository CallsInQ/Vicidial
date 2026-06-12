import type { FastifyPluginAsync } from "fastify";
import type { DashboardSnapshot } from "@qdialer/shared";
import type { AppConfig } from "../config/env.js";
import type { QdialerAppContext } from "../app-context.js";
import { createDashboardSnapshot } from "../services/dashboard-snapshot.js";

type DashboardRouteOptions = {
  config: AppConfig;
  context: QdialerAppContext;
};

export const dashboardRoutes: FastifyPluginAsync<DashboardRouteOptions> = async (app, options) => {
  app.get("/dashboard/snapshot", async (): Promise<DashboardSnapshot> => {
    return createDashboardSnapshot(options.context);
  });
};
