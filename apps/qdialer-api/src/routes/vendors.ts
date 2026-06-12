import type { FastifyPluginAsync } from "fastify";
import type { VendorCostRule, VendorSourceType, VendorCostMode } from "@qdialer/shared";
import { z } from "zod";
import type { AppConfig } from "../config/env.js";

const vendorCostRuleSchema = z.object({
  vendorName: z.string().min(1),
  sourceType: z.enum(["ingroup", "list", "webhook"]),
  sourceId: z.string().min(1),
  costMode: z.enum(["cpa", "cpl", "duration"]),
  costCents: z.number().int().nonnegative(),
  billableDurationSeconds: z.number().int().nonnegative().default(0),
  acquisitionStatuses: z.array(z.string().min(1)).default(["SALE"]),
  active: z.boolean().default(true)
});

const demoRules: VendorCostRule[] = [
  {
    id: "rule_tld_web_01",
    vendorName: "TLD Web Transfers",
    sourceType: "webhook",
    sourceId: "TLD-WEB-01",
    costMode: "cpa",
    costCents: 7000,
    billableDurationSeconds: 0,
    acquisitionStatuses: ["SALE"],
    active: true
  }
];

export const vendorRoutes: FastifyPluginAsync<{ config: AppConfig }> = async (app) => {
  app.get("/vendors/cost-rules", async (): Promise<VendorCostRule[]> => {
    return demoRules;
  });

  app.post("/vendors/cost-rules", async (request, reply): Promise<VendorCostRule> => {
    const parsed = vendorCostRuleSchema.parse(request.body);
    const rule: VendorCostRule = {
      id: `rule_${Date.now()}`,
      vendorName: parsed.vendorName,
      sourceType: parsed.sourceType as VendorSourceType,
      sourceId: parsed.sourceId,
      costMode: parsed.costMode as VendorCostMode,
      costCents: parsed.costCents,
      billableDurationSeconds: parsed.billableDurationSeconds,
      acquisitionStatuses: parsed.acquisitionStatuses,
      active: parsed.active
    };

    demoRules.push(rule);
    reply.code(201);
    return rule;
  });
};
