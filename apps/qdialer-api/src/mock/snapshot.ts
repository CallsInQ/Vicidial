import type { DashboardSnapshot } from "@qdialer/shared";

export function createMockDashboardSnapshot(): DashboardSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    metrics: [
      { label: "Live agents", value: "42", delta: "+8 today", tone: "good" },
      { label: "Billable vendor spend", value: "$12.4k", delta: "-7% CPA", tone: "good" },
      { label: "Acquisitions", value: "186", delta: "+23 vs yesterday", tone: "good" },
      { label: "Bad lead rate", value: "9.8%", delta: "watch list B", tone: "warning" }
    ],
    vendorCost: [
      {
        vendorId: "TLD-WEB-01",
        vendorName: "TLD Web Transfers",
        sourceType: "webhook",
        costMode: "cpa",
        billableEvents: 81,
        spend: 5670,
        acquisitions: 64,
        vendorCpa: 88.59,
        badLeadRate: 7.8
      },
      {
        vendorId: "ING-NY-03",
        vendorName: "Inbound Queue NY",
        sourceType: "ingroup",
        costMode: "duration",
        billableEvents: 342,
        spend: 1368,
        acquisitions: 38,
        vendorCpa: 36,
        badLeadRate: 12.1
      },
      {
        vendorId: "LIST-FB-19",
        vendorName: "Facebook Lead Batch",
        sourceType: "list",
        costMode: "cpl",
        billableEvents: 518,
        spend: 1554,
        acquisitions: 44,
        vendorCpa: 35.32,
        badLeadRate: 18.4
      }
    ],
    agentProductivity: [
      {
        user: "2001",
        fullName: "Maya Chen",
        calls: 92,
        talkMinutes: 248,
        acquisitions: 17,
        closeRate: 18.5,
        agentMinutesPerAcquisition: 14.6,
        readyHours: 5.8
      },
      {
        user: "2007",
        fullName: "Jordan Blake",
        calls: 74,
        talkMinutes: 231,
        acquisitions: 12,
        closeRate: 16.2,
        agentMinutesPerAcquisition: 19.3,
        readyHours: 6.2
      },
      {
        user: "2014",
        fullName: "Ari Patel",
        calls: 101,
        talkMinutes: 219,
        acquisitions: 10,
        closeRate: 9.9,
        agentMinutesPerAcquisition: 21.9,
        readyHours: 4.9
      }
    ],
    liveAgents: [
      {
        user: "2001",
        fullName: "Maya Chen",
        status: "INCALL",
        campaignId: "SOLAR-A",
        callsToday: 92,
        pauseCode: "",
        serverIp: "10.0.0.11"
      },
      {
        user: "2007",
        fullName: "Jordan Blake",
        status: "READY",
        campaignId: "SOLAR-A",
        callsToday: 74,
        pauseCode: "",
        serverIp: "10.0.0.12"
      },
      {
        user: "2014",
        fullName: "Ari Patel",
        status: "PAUSED",
        campaignId: "MEDICARE-B",
        callsToday: 101,
        pauseCode: "BREAK",
        serverIp: "10.0.0.11"
      }
    ]
  };
}
