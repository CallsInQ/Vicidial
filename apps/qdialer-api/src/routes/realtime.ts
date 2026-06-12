import type { FastifyPluginAsync } from "fastify";
import type { AppConfig } from "../config/env.js";
import { createMockDashboardSnapshot } from "../mock/snapshot.js";

export const realtimeRoutes: FastifyPluginAsync<{ config: AppConfig }> = async (app) => {
  app.get("/realtime/events", async (request, reply) => {
    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });

    const sendSnapshot = () => {
      reply.raw.write(`event: snapshot\ndata: ${JSON.stringify(createMockDashboardSnapshot())}\n\n`);
    };

    sendSnapshot();
    const timer = setInterval(sendSnapshot, 5_000);

    request.raw.on("close", () => {
      clearInterval(timer);
      reply.raw.end();
    });
  });
};
