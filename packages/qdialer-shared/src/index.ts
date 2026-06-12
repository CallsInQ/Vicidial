export type VendorCostMode = "cpa" | "cpl" | "duration";
export type VendorSourceType = "ingroup" | "list" | "webhook";

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "good" | "warning" | "danger" | "neutral";
};

export type VendorCostRow = {
  vendorId: string;
  vendorName: string;
  sourceType: VendorSourceType;
  costMode: VendorCostMode;
  billableEvents: number;
  spend: number;
  acquisitions: number;
  vendorCpa: number;
  badLeadRate: number;
};

export type VendorCostRule = {
  id: string;
  vendorName: string;
  sourceType: VendorSourceType;
  sourceId: string;
  costMode: VendorCostMode;
  costCents: number;
  billableDurationSeconds: number;
  acquisitionStatuses: string[];
  active: boolean;
};

export type AgentProductivityRow = {
  user: string;
  fullName: string;
  calls: number;
  talkMinutes: number;
  acquisitions: number;
  closeRate: number;
  agentMinutesPerAcquisition: number;
  readyHours: number;
};

export type LiveAgent = {
  user: string;
  fullName: string;
  status: string;
  campaignId: string;
  callsToday: number;
  pauseCode: string;
  serverIp: string;
};

export type DashboardSnapshot = {
  generatedAt: string;
  metrics: DashboardMetric[];
  vendorCost: VendorCostRow[];
  agentProductivity: AgentProductivityRow[];
  liveAgents: LiveAgent[];
};

export type DependencyHealth = {
  configured: boolean;
  ok: boolean;
  detail?: string;
};

export type HealthResponse = {
  ok: boolean;
  service: string;
  mode: "mock" | "live";
  generatedAt: string;
  dependencies: {
    postgres: DependencyHealth;
    redis: DependencyHealth;
    vicidialDb: DependencyHealth;
    vicidialApi: DependencyHealth;
  };
};
