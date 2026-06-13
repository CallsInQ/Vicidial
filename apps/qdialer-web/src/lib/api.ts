import type { DashboardSnapshot, HealthResponse, VendorCostRule, VendorCostRuleInput, VendorCostRulePatch } from "@qdialer/shared";
import { mockDashboardSnapshot } from "@/lib/mock-data";

const API_BASE = import.meta.env.VITE_QDIALER_API_BASE ?? "/api/v1";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`qDialer API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function sendJson<TResponse, TBody>(path: string, method: "POST" | "PATCH", body: TBody): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`qDialer API request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/health");
}

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  try {
    return await fetchJson<DashboardSnapshot>("/dashboard/snapshot");
  } catch {
    return mockDashboardSnapshot;
  }
}

export async function fetchVendorCostRules(): Promise<VendorCostRule[]> {
  return fetchJson<VendorCostRule[]>("/vendors/cost-rules");
}

export async function createVendorCostRule(input: VendorCostRuleInput): Promise<VendorCostRule> {
  return sendJson<VendorCostRule, VendorCostRuleInput>("/vendors/cost-rules", "POST", input);
}

export async function updateVendorCostRule(id: string, patch: VendorCostRulePatch): Promise<VendorCostRule> {
  return sendJson<VendorCostRule, VendorCostRulePatch>(`/vendors/cost-rules/${id}`, "PATCH", patch);
}
