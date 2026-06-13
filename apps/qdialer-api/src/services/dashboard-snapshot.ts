import type { DashboardMetric, DashboardSnapshot, LiveAgent, VendorCostRow, VendorCostRule } from "@qdialer/shared";
import type { QdialerAppContext } from "../app-context.js";
import { createMockDashboardSnapshot } from "../mock/snapshot.js";
import { listVendorCostRules } from "./vendor-cost-rules.js";

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

function vendorRuleToCostRow(rule: VendorCostRule): VendorCostRow {
  const configuredCost = rule.costCents / 100;

  return {
    vendorId: rule.sourceId,
    vendorName: rule.vendorName,
    sourceType: rule.sourceType,
    costMode: rule.costMode,
    billableEvents: 0,
    spend: 0,
    acquisitions: 0,
    vendorCpa: configuredCost,
    badLeadRate: 0
  };
}

export async function createDashboardSnapshot(context: QdialerAppContext): Promise<DashboardSnapshot> {
  const snapshot = createMockDashboardSnapshot();
  const liveAgentsPromise = context.vicidialDb.configured
    ? context.vicidialDb.fetchLiveAgents()
    : Promise.resolve(snapshot.liveAgents);
  const vendorRulesPromise = context.qdialerPool
    ? listVendorCostRules(context.qdialerPool).catch(() => [] as VendorCostRule[])
    : Promise.resolve([] as VendorCostRule[]);

  const [liveAgents, vendorRules] = await Promise.all([liveAgentsPromise, vendorRulesPromise]);
  const vendorCost = vendorRules.length > 0 ? vendorRules.map(vendorRuleToCostRow) : snapshot.vendorCost;

  return {
    ...snapshot,
    generatedAt: new Date().toISOString(),
    metrics: [
      liveAgentMetric(liveAgents),
      ...snapshot.metrics.filter((metric) => metric.label !== "Live agents")
    ],
    vendorCost,
    liveAgents
  };
}
