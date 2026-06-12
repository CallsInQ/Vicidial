import type { FastifyPluginAsync } from "fastify";
import type { AppConfig } from "../config/env.js";
import type { QdialerAppContext } from "../app-context.js";
import { createDashboardSnapshot } from "../services/dashboard-snapshot.js";

type RealtimeRouteOptions = {
  config: AppConfig;
  context: QdialerAppContext;
};

export const realtimeRoutes: FastifyPluginAsync<RealtimeRouteOptions> = async (app, options) => {
  app.get("/realtime/events", async (request, reply) => {
    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });

    const sendSnapshot = async () => {
      const snapshot = await createDashboardSnapshot(options.context);
      reply.raw.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);
    };

    await sendSnapshot();
    const timer = setInterval(() => {
      sendSnapshot().catch((error: unknown) => {
        app.log.warn({ error }, "Failed to send qDialer realtime snapshot");
      });
    }, 5_000);

    request.raw.on("close", () => {
      clearInterval(timer);
      reply.raw.end();
    });
  });
};
