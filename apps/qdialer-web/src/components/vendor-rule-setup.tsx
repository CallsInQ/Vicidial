import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VendorCostMode, VendorCostRule, VendorSourceType } from "@qdialer/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createVendorCostRule, fetchVendorCostRules, updateVendorCostRule } from "@/lib/api";
import { cn } from "@/lib/utils";

type VendorRuleFormState = {
  vendorName: string;
  sourceType: VendorSourceType;
  sourceId: string;
  costMode: VendorCostMode;
  costDollars: string;
  billableDurationSeconds: string;
  acquisitionStatuses: string;
};

const defaultForm: VendorRuleFormState = {
  vendorName: "",
  sourceType: "ingroup",
  sourceId: "",
  costMode: "cpa",
  costDollars: "70",
  billableDurationSeconds: "0",
  acquisitionStatuses: "SALE"
};

const selectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function splitStatuses(statuses: string): string[] {
  const values = statuses.split(",").map((status) => status.trim().toUpperCase()).filter(Boolean);
  return values.length > 0 ? Array.from(new Set(values)) : ["SALE"];
}

function dollarsToCents(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0;
}

function formatRuleCost(rule: VendorCostRule): string {
  const amount = currency.format(rule.costCents / 100);
  if (rule.costMode === "duration") {
    return `${amount} after ${rule.billableDurationSeconds}s`;
  }

  return amount;
}

export function VendorRuleSetup() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VendorRuleFormState>(defaultForm);
  const rulesQuery = useQuery({
    queryKey: ["vendor-cost-rules"],
    queryFn: fetchVendorCostRules
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createVendorCostRule({
        vendorName: form.vendorName,
        sourceType: form.sourceType,
        sourceId: form.sourceId,
        costMode: form.costMode,
        costCents: dollarsToCents(form.costDollars),
        billableDurationSeconds: Number.parseInt(form.billableDurationSeconds, 10) || 0,
        acquisitionStatuses: splitStatuses(form.acquisitionStatuses),
        active: true
      }),
    onSuccess: async () => {
      setForm(defaultForm);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vendor-cost-rules"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-snapshot"] })
      ]);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: VendorCostRule) => updateVendorCostRule(rule.id, { active: !rule.active }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["vendor-cost-rules"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-snapshot"] })
      ]);
    }
  });

  function updateField<TKey extends keyof VendorRuleFormState>(key: TKey, value: VendorRuleFormState[TKey]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate();
  }

  const rules = rulesQuery.data ?? [];

  return (
    <Card id="sources" className="bg-white/[0.92]">
      <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Vendor Source Setup</CardTitle>
          <CardDescription>
            Add the vendor/source rules qDialer needs before it can calculate CPA, CPL, and duration-based vendor cost.
          </CardDescription>
        </div>
        <Badge variant="secondary">{rules.length} saved rules</Badge>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form className="grid gap-4 rounded-[1.5rem] border border-border bg-muted/30 p-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-semibold" htmlFor="vendor-name">Vendor name</label>
            <Input
              id="vendor-name"
              value={form.vendorName}
              onChange={(event) => updateField("vendorName", event.target.value)}
              placeholder="TLD Web Transfers"
              required
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="source-type">Source type</label>
              <select
                id="source-type"
                className={selectClassName}
                value={form.sourceType}
                onChange={(event) => updateField("sourceType", event.target.value as VendorSourceType)}
              >
                <option value="ingroup">In-group</option>
                <option value="list">List</option>
                <option value="webhook">Webhook/data lead</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="source-id">VICI source ID</label>
              <Input
                id="source-id"
                value={form.sourceId}
                onChange={(event) => updateField("sourceId", event.target.value)}
                placeholder="ING-NY-03 or LIST-FB-19"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="cost-mode">Cost model</label>
              <select
                id="cost-mode"
                className={selectClassName}
                value={form.costMode}
                onChange={(event) => updateField("costMode", event.target.value as VendorCostMode)}
              >
                <option value="cpa">CPA</option>
                <option value="cpl">CPL</option>
                <option value="duration">Duration</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="cost-dollars">Vendor cost</label>
              <Input
                id="cost-dollars"
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                value={form.costDollars}
                onChange={(event) => updateField("costDollars", event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold" htmlFor="duration-seconds">Billable seconds</label>
              <Input
                id="duration-seconds"
                inputMode="numeric"
                min="0"
                type="number"
                value={form.billableDurationSeconds}
                onChange={(event) => updateField("billableDurationSeconds", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold" htmlFor="acquisition-statuses">Acquisition statuses</label>
            <Input
              id="acquisition-statuses"
              value={form.acquisitionStatuses}
              onChange={(event) => updateField("acquisitionStatuses", event.target.value)}
              placeholder="SALE, XFER"
            />
            <p className="text-xs text-muted-foreground">Comma-separated VICIDIAL statuses. Default acquisition status is SALE.</p>
          </div>

          {createMutation.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              Could not save this vendor rule. Check the API and try again.
            </p>
          ) : null}

          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save vendor rule"}
          </Button>
        </form>

        <div className="grid content-start gap-3">
          {rulesQuery.isFetching ? <p className="text-sm text-muted-foreground">Refreshing saved vendor rules...</p> : null}
          {rules.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
              No saved vendor source rules yet. Add one to start replacing mock vendor reporting with qDialer-owned setup data.
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="rounded-[1.5rem] border border-border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{rule.vendorName}</p>
                      <Badge variant={rule.active ? "success" : "secondary"}>{rule.active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rule.sourceType} / {rule.sourceId}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(rule)}
                  >
                    {rule.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Model</dt>
                    <dd className="mt-1 font-semibold uppercase">{rule.costMode}</dd>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cost</dt>
                    <dd className="mt-1 font-semibold">{formatRuleCost(rule)}</dd>
                  </div>
                  <div className="rounded-2xl bg-muted/40 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statuses</dt>
                    <dd className={cn("mt-1 font-semibold", rule.acquisitionStatuses.length > 2 && "text-xs")}>
                      {rule.acquisitionStatuses.join(", ")}
                    </dd>
                  </div>
                </dl>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
