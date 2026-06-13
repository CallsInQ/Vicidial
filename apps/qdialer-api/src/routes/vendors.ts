import type { FastifyPluginAsync } from "fastify";
import type { VendorCostRule, VendorCostRuleInput, VendorCostRulePatch } from "@qdialer/shared";
import { z } from "zod";
import type { AppConfig } from "../config/env.js";
import type { QdialerAppContext } from "../app-context.js";
import { createVendorCostRule, listVendorCostRules, updateVendorCostRule } from "../services/vendor-cost-rules.js";

type VendorRouteOptions = {
  config: AppConfig;
  context: QdialerAppContext;
};

const vendorCostRuleSchema = z.object({
  vendorName: z.string().trim().min(1),
  sourceType: z.enum(["ingroup", "list", "webhook"]),
  sourceId: z.string().trim().min(1),
  costMode: z.enum(["cpa", "cpl", "duration"]),
  costCents: z.coerce.number().int().nonnegative(),
  billableDurationSeconds: z.coerce.number().int().nonnegative().default(0),
  acquisitionStatuses: z.array(z.string().trim().min(1)).default(["SALE"]),
  active: z.boolean().default(true)
});

const vendorCostRulePatchSchema = vendorCostRuleSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required."
});

const vendorCostRuleParamsSchema = z.object({
  id: z.string().min(1)
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

function updateDemoRule(id: string, patch: VendorCostRulePatch): VendorCostRule | null {
  const index = demoRules.findIndex((rule) => rule.id === id);
  if (index === -1) {
    return null;
  }

  const updated = {
    ...demoRules[index],
    ...patch
  };

  demoRules[index] = updated;
  return updated;
}

export const vendorRoutes: FastifyPluginAsync<VendorRouteOptions> = async (app, options) => {
  app.get("/vendors/cost-rules", async (): Promise<VendorCostRule[]> => {
    if (options.context.qdialerPool) {
      return listVendorCostRules(options.context.qdialerPool);
    }

    return demoRules;
  });

  app.post("/vendors/cost-rules", async (request, reply): Promise<VendorCostRule> => {
    const parsed = vendorCostRuleSchema.parse(request.body) satisfies VendorCostRuleInput;

    if (options.context.qdialerPool) {
      const rule = await createVendorCostRule(options.context.qdialerPool, parsed);
      reply.code(201);
      return rule;
    }

    const rule = {
      id: `rule_${Date.now()}`,
      vendorName: parsed.vendorName,
      sourceType: parsed.sourceType,
      sourceId: parsed.sourceId,
      costMode: parsed.costMode,
      costCents: parsed.costCents,
      billableDurationSeconds: parsed.billableDurationSeconds,
      acquisitionStatuses: parsed.acquisitionStatuses,
      active: parsed.active
    } satisfies VendorCostRule;

    demoRules.push(rule);
    reply.code(201);
    return rule;
  });

  app.patch("/vendors/cost-rules/:id", async (request, reply): Promise<VendorCostRule | { error: string }> => {
    const { id } = vendorCostRuleParamsSchema.parse(request.params);
    const parsed = vendorCostRulePatchSchema.parse(request.body) satisfies VendorCostRulePatch;

    const rule = options.context.qdialerPool
      ? await updateVendorCostRule(options.context.qdialerPool, id, parsed)
      : updateDemoRule(id, parsed);

    if (!rule) {
      reply.code(404);
      return { error: `Vendor cost rule ${id} was not found.` };
    }

    return rule;
  });
};
