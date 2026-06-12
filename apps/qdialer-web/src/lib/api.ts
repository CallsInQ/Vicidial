import type { DashboardSnapshot, HealthResponse } from "@qdialer/shared";
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
