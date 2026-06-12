import type { DashboardMetric, DashboardSnapshot, LiveAgent } from "@qdialer/shared";
import type { QdialerAppContext } from "../app-context.js";
import { createMockDashboardSnapshot } from "../mock/snapshot.js";

function liveAgentMetric(liveAgents: LiveAgent[]): DashboardMetric {
  const ready = liveAgents.filter((agent) => agent.status === "READY").length;
  const inCall = liveAgents.filter((agent) => ["INCALL", "QUEUE", "3-WAY"].includes(agent.status)).length;

  return {
    label: "Live agents",
    value: String(liveAgents.length),
    delta: `${ready} ready / ${inCall} in call`,
    tone: liveAgents.length > 0 ? "good" : "neutral"
  };
}

export async function createDashboardSnapshot(context: QdialerAppContext): Promise<DashboardSnapshot> {
  const snapshot = createMockDashboardSnapshot();

  if (!context.vicidialDb.configured) {
    return snapshot;
  }

  const liveAgents = await context.vicidialDb.fetchLiveAgents();

  return {
    ...snapshot,
    generatedAt: new Date().toISOString(),
    metrics: [
      liveAgentMetric(liveAgents),
      ...snapshot.metrics.filter((metric) => metric.label !== "Live agents")
    ],
    liveAgents
  };
}
