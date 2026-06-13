import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  AgentProductivityRow,
  DashboardMetric,
  DashboardSnapshot,
  DependencyHealth,
  HealthResponse,
  VendorCostRow
} from "@qdialer/shared";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Command,
  Headphones,
  ListChecks,
  Phone,
  RadioTower,
  Search,
  Settings,
  ShieldCheck,
  type LucideIcon,
  Users,
  WalletCards
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommandMenu } from "@/components/command-menu";
import { DataTable } from "@/components/data-table";
import { VendorRuleSetup } from "@/components/vendor-rule-setup";
import { navigationItems, type NavigationItemId } from "@/data/navigation";
import { fetchDashboardSnapshot, fetchHealth } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useShellStore } from "@/stores/use-shell-store";

type PageMeta = {
  eyebrow: string;
  title: string;
  description: string;
};

type LaunchLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

type CsvRow = Record<string, boolean | number | string | null | undefined>;

type PageProps = {
  health?: HealthResponse;
  isFetching: boolean;
  setCommandOpen: (commandOpen: boolean) => void;
  snapshot?: DashboardSnapshot;
};

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const assetBase = import.meta.env.BASE_URL;
const logoSrc = `${assetBase}qdialer-logo.png`;
const navIds = new Set<string>(navigationItems.map((item) => item.id));

const pageMeta = {
  dashboard: {
    eyebrow: "qDialer Command Center",
    title: "Agency decisions without the VICI maze.",
    description: "A modern operating hub over the proven VICIDIAL engine."
  },
  live: {
    eyebrow: "Live floor",
    title: "Live Agents",
    description: "Realtime agent state, calls today, campaign assignment, and a launch path to the classic VICI realtime view."
  },
  users: {
    eyebrow: "Administration",
    title: "Users",
    description: "Manage agent/admin access through VICIDIAL today, with qDialer role overlays coming next."
  },
  leads: {
    eyebrow: "Customer data",
    title: "Lead Lookup",
    description: "Jump into the proven VICIDIAL lead search flow while qDialer builds native lead review."
  },
  recordings: {
    eyebrow: "Quality workflow",
    title: "Recordings",
    description: "Review queues for qDialer coaching plus direct access to VICIDIAL recording lookup."
  },
  numbers: {
    eyebrow: "Telephony",
    title: "Numbers",
    description: "Quick access to phone inventory and the legacy telephony admin tools that keep dialing online."
  },
  ingroups: {
    eyebrow: "Inbound routing",
    title: "In-Groups",
    description: "Launch in-group administration and connect inbound queues to qDialer vendor cost rules."
  },
  campaigns: {
    eyebrow: "Dialing setup",
    title: "Campaigns",
    description: "Manage campaign behavior in VICIDIAL while qDialer focuses on cleaner workflows and reporting."
  },
  sources: {
    eyebrow: "Attribution setup",
    title: "Lists & Sources",
    description: "Create vendor/source cost rules for lists, in-groups, and webhook/data leads."
  },
  vendors: {
    eyebrow: "Agency reporting",
    title: "Vendor Cost",
    description: "A dedicated page for vendor spend, CPA/CPL/duration rules, and upcoming billable call attribution."
  },
  agents: {
    eyebrow: "Sales management",
    title: "Agent Productivity",
    description: "Raw output, close rate, talk time, and efficiency views for coaching decisions."
  },
  reports: {
    eyebrow: "Reporting center",
    title: "Reports",
    description: "qDialer-native report destinations plus direct access to the VICIDIAL reporting library."
  },
  setup: {
    eyebrow: "System readiness",
    title: "Setup",
    description: "See connector health and the next setup flows qDialer needs before full live reporting."
  },
  advanced: {
    eyebrow: "Admin fallback",
    title: "Advanced VICIDIAL",
    description: "Clearly marked access to the legacy engine for advanced settings qDialer has not rebuilt yet."
  }
} satisfies Record<NavigationItemId, PageMeta>;

const legacyLinks = {
  users: {
    title: "VICIDIAL Users",
    description: "Open the legacy user list and user editor.",
    href: "/vicidial/admin.php?ADD=0",
    icon: Users,
    badge: "Legacy"
  },
  liveAgents: {
    title: "VICIDIAL Realtime",
    description: "Open the classic live agent/realtime report.",
    href: "/vicidial/realtime_report.php",
    icon: RadioTower,
    badge: "Live"
  },
  leadLookup: {
    title: "Lead Lookup",
    description: "Search existing VICIDIAL leads and call history.",
    href: "/vicidial/admin_search_lead.php",
    icon: Search,
    badge: "Lookup"
  },
  recordingLookup: {
    title: "Recording Lookup",
    description: "Find and listen to VICIDIAL recordings.",
    href: "/vicidial/recording_lookup.php",
    icon: Headphones,
    badge: "QA"
  },
  numbers: {
    title: "Numbers / Phones",
    description: "Open VICIDIAL phone and number administration.",
    href: "/vicidial/admin.php?ADD=10000000000",
    icon: Phone,
    badge: "Telephony"
  },
  ingroups: {
    title: "In-Groups",
    description: "Manage inbound queues and routing.",
    href: "/vicidial/admin.php?ADD=1000",
    icon: Boxes,
    badge: "Inbound"
  },
  campaigns: {
    title: "Campaigns",
    description: "Manage VICIDIAL campaign configuration.",
    href: "/vicidial/admin.php?ADD=10",
    icon: ShieldCheck,
    badge: "Dialing"
  },
  lists: {
    title: "Lists",
    description: "Open VICIDIAL list management.",
    href: "/vicidial/admin.php?ADD=100",
    icon: ListChecks,
    badge: "Sources"
  },
  reports: {
    title: "VICIDIAL Reports",
    description: "Open the classic report menu.",
    href: "/vicidial/admin.php?ADD=999999",
    icon: BarChart3,
    badge: "Reports"
  },
  admin: {
    title: "Advanced Admin",
    description: "Open the main VICIDIAL admin panel.",
    href: "/vicidial/admin.php",
    icon: Settings,
    badge: "Advanced"
  }
} satisfies Record<string, LaunchLink>;

const dashboardLaunches = [
  legacyLinks.users,
  legacyLinks.liveAgents,
  legacyLinks.leadLookup,
  legacyLinks.recordingLookup,
  legacyLinks.numbers,
  legacyLinks.ingroups,
  legacyLinks.campaigns,
  legacyLinks.lists,
  legacyLinks.reports
];

const vendorColumns: ColumnDef<VendorCostRow>[] = [
  {
    accessorKey: "vendorName",
    header: "Vendor",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold">{row.original.vendorName}</span>
        <span className="text-xs text-muted-foreground">{row.original.vendorId}</span>
      </div>
    )
  },
  { accessorKey: "sourceType", header: "Source" },
  { accessorKey: "costMode", header: "Rule" },
  { accessorKey: "billableEvents", header: "Billable" },
  {
    accessorKey: "spend",
    header: "Spend",
    cell: ({ row }) => currency.format(row.original.spend)
  },
  {
    accessorKey: "vendorCpa",
    header: "Vendor CPA",
    cell: ({ row }) => currency.format(row.original.vendorCpa)
  },
  {
    accessorKey: "badLeadRate",
    header: "Bad Lead %",
    cell: ({ row }) => `${row.original.badLeadRate.toFixed(1)}%`
  }
];

const agentColumns: ColumnDef<AgentProductivityRow>[] = [
  {
    accessorKey: "fullName",
    header: "Agent",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold">{row.original.fullName}</span>
        <span className="text-xs text-muted-foreground">User {row.original.user}</span>
      </div>
    )
  },
  { accessorKey: "calls", header: "Calls" },
  { accessorKey: "talkMinutes", header: "Talk min" },
  { accessorKey: "acquisitions", header: "Acq." },
  {
    accessorKey: "closeRate",
    header: "Close %",
    cell: ({ row }) => `${row.original.closeRate.toFixed(1)}%`
  },
  {
    accessorKey: "agentMinutesPerAcquisition",
    header: "Min / Acq.",
    cell: ({ row }) => row.original.agentMinutesPerAcquisition.toFixed(1)
  }
];

function isNavigationItemId(value: string): value is NavigationItemId {
  return navIds.has(value);
}

function readHashNav(): NavigationItemId {
  const value = window.location.hash.replace(/^#\/?/, "");
  return isNavigationItemId(value) ? value : "dashboard";
}

function csvEscape(value: CsvRow[string]): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: CsvRow[]) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0] ?? {});
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function vendorCsvRows(rows: VendorCostRow[]): CsvRow[] {
  return rows.map((row) => ({
    vendor_id: row.vendorId,
    vendor_name: row.vendorName,
    source_type: row.sourceType,
    cost_mode: row.costMode,
    billable_events: row.billableEvents,
    spend: row.spend,
    acquisitions: row.acquisitions,
    vendor_cpa: row.vendorCpa,
    bad_lead_rate: row.badLeadRate
  }));
}

function agentCsvRows(rows: AgentProductivityRow[]): CsvRow[] {
  return rows.map((row) => ({
    user: row.user,
    full_name: row.fullName,
    calls: row.calls,
    talk_minutes: row.talkMinutes,
    acquisitions: row.acquisitions,
    close_rate: row.closeRate,
    agent_minutes_per_acquisition: row.agentMinutesPerAcquisition,
    ready_hours: row.readyHours
  }));
}

export function App() {
  const snapshotQuery = useQuery({
    queryKey: ["dashboard-snapshot"],
    queryFn: fetchDashboardSnapshot,
    refetchInterval: 20_000
  });
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 60_000
  });
  const activeNav = useShellStore((state) => state.activeNav);
  const setActiveNav = useShellStore((state) => state.setActiveNav);
  const setCommandOpen = useShellStore((state) => state.setCommandOpen);
  const meta = pageMeta[activeNav];

  useEffect(() => {
    const syncNavFromHash = () => setActiveNav(readHashNav());
    syncNavFromHash();
    window.addEventListener("hashchange", syncNavFromHash);
    return () => window.removeEventListener("hashchange", syncNavFromHash);
  }, [setActiveNav]);

  const pageProps: PageProps = {
    health: healthQuery.data,
    isFetching: snapshotQuery.isFetching,
    setCommandOpen,
    snapshot: snapshotQuery.data
  };

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen qd-shell-grid">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-brand-cyan/20 bg-brand-navy p-5 text-slate-200 shadow-2xl lg:block">
          <a
            className="mb-6 flex rounded-[1.5rem] border border-brand-cyan/20 bg-white/5 p-3 shadow-inner shadow-white/5"
            href="#/dashboard"
            onClick={() => setActiveNav("dashboard")}
          >
            <img src={logoSrc} alt="qDialer" className="h-14 w-full object-contain object-left" />
          </a>
          <ShellNav activeNav={activeNav} setActiveNav={setActiveNav} />
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <MobileNav activeNav={activeNav} setActiveNav={setActiveNav} />
          <PageHero meta={meta} setCommandOpen={setCommandOpen} />
          {renderPage(activeNav, pageProps)}
        </main>
      </div>
      <CommandMenu />
    </div>
  );
}

function ShellNav({
  activeNav,
  setActiveNav
}: {
  activeNav: NavigationItemId;
  setActiveNav: (activeNav: NavigationItemId) => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {navigationItems.map((item) => (
        <a
          key={item.id}
          href={item.href}
          onClick={() => setActiveNav(item.id)}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-brand-cyan/10 hover:text-white",
            activeNav === item.id && "bg-brand-cyan text-brand-navy hover:bg-brand-cyan hover:text-brand-navy"
          )}
        >
          <item.icon data-icon="inline-start" />
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function MobileNav({
  activeNav,
  setActiveNav
}: {
  activeNav: NavigationItemId;
  setActiveNav: (activeNav: NavigationItemId) => void;
}) {
  return (
    <div className="mb-4 grid gap-3 rounded-[1.5rem] border border-brand-cyan/20 bg-brand-navy p-3 text-white shadow-glow lg:hidden">
      <img src={logoSrc} alt="qDialer" className="h-12 w-full object-contain object-left" />
      <select
        className="h-11 rounded-2xl border border-white/10 bg-white/10 px-3 text-sm font-semibold text-white outline-none"
        value={activeNav}
        onChange={(event) => {
          const nextNav = event.target.value;
          if (isNavigationItemId(nextNav)) {
            setActiveNav(nextNav);
            window.location.hash = `/${nextNav}`;
          }
        }}
      >
        {navigationItems.map((item) => (
          <option key={item.id} value={item.id} className="text-brand-navy">
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PageHero({ meta, setCommandOpen }: { meta: PageMeta; setCommandOpen: (commandOpen: boolean) => void }) {
  return (
    <header className="mb-6 flex flex-col gap-5 overflow-hidden rounded-[1.75rem] border border-brand-cyan/20 bg-brand-navy p-5 text-white shadow-glow backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="mb-4 flex max-w-xl rounded-[1.25rem] border border-white/10 bg-white/5 p-3">
          <img src={logoSrc} alt="qDialer" className="h-20 w-full object-contain object-left" />
        </div>
        <p className="text-sm font-semibold text-brand-cyan">{meta.eyebrow}</p>
        <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white md:text-5xl">{meta.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">{meta.description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setCommandOpen(true)}>
          <Command data-icon="inline-start" />
          Command
        </Button>
        <Button asChild>
          <a href={legacyLinks.admin.href}>
            Advanced VICI
            <ArrowUpRight data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </header>
  );
}

function renderPage(activeNav: NavigationItemId, props: PageProps) {
  switch (activeNav) {
    case "dashboard":
      return <DashboardPage {...props} />;
    case "live":
      return <LiveAgentsPage {...props} />;
    case "users":
      return <UtilityPage links={[legacyLinks.users, legacyLinks.admin]} steps={["Create or edit the VICIDIAL user.", "Set campaign/user-group access in VICI.", "Return here when qDialer role overlays are added."]} />;
    case "leads":
      return <UtilityPage links={[legacyLinks.leadLookup, legacyLinks.lists]} steps={["Search by phone, lead ID, or customer details in VICI.", "Review list/source context.", "Use qDialer vendor attribution once source rules are configured."]} />;
    case "recordings":
      return <RecordingsPage />;
    case "numbers":
      return <UtilityPage links={[legacyLinks.numbers, legacyLinks.admin]} steps={["Open phone/number admin.", "Confirm carrier and server routing in advanced VICI if needed.", "Use qDialer setup notes to keep client deployments consistent."]} />;
    case "ingroups":
      return <UtilityPage links={[legacyLinks.ingroups, legacyLinks.liveAgents]} steps={["Manage inbound queues in VICIDIAL.", "Map billable vendor duration rules in Lists & Sources.", "Use Vendor Cost to see attribution once call math is wired."]} />;
    case "campaigns":
      return <UtilityPage links={[legacyLinks.campaigns, legacyLinks.reports]} steps={["Configure campaign behavior in VICIDIAL.", "Verify active lists and statuses.", "Use qDialer reporting for manager-facing decisions."]} />;
    case "sources":
      return <SourcesPage />;
    case "vendors":
      return <VendorCostPage {...props} />;
    case "agents":
      return <AgentProductivityPage {...props} />;
    case "reports":
      return <ReportsPage {...props} />;
    case "setup":
      return <SetupPage health={props.health} />;
    case "advanced":
      return <AdvancedViciPage />;
    default:
      return <DashboardPage {...props} />;
  }
}

function DashboardPage({ snapshot }: PageProps) {
  return (
    <div className="grid gap-6">
      <MetricGrid metrics={snapshot?.metrics ?? []} />
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="bg-white/[0.92]">
          <CardHeader>
            <CardTitle>Quick Launch</CardTitle>
            <CardDescription>Every major qDialer/VICIDIAL workflow now has a distinct destination.</CardDescription>
          </CardHeader>
          <CardContent>
            <LaunchGrid links={dashboardLaunches.slice(0, 6)} />
          </CardContent>
        </Card>
        <Card className="overflow-hidden bg-brand-navy text-white">
          <CardHeader>
            <CardTitle>Build Direction</CardTitle>
            <CardDescription className="text-slate-300">
              Native qDialer pages where managers need modern decisions, legacy launchers where VICI still owns the workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <DarkMiniCard icon={WalletCards} title="Vendor Cost" text="Saved rules are live; attribution math is next." />
            <DarkMiniCard icon={Users} title="Agent Productivity" text="Leaderboard page split is ready for real joins." />
            <DarkMiniCard icon={ShieldCheck} title="VICI Safe" text="Advanced tools remain available without hiding them." />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-white/90">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardDescription>{metric.label}</CardDescription>
              <Badge variant={metric.tone === "good" ? "success" : metric.tone === "warning" ? "warning" : "secondary"}>
                {metric.delta}
              </Badge>
            </div>
            <CardTitle className="text-4xl">{metric.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </section>
  );
}

function LiveAgentsPage({ isFetching, snapshot }: PageProps) {
  const liveAgents = snapshot?.liveAgents ?? [];

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <Card className="overflow-hidden bg-brand-navy text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Floor</CardTitle>
                <CardDescription className="text-slate-300">Realtime VICI status refreshes every 20 seconds.</CardDescription>
              </div>
              <RadioTower className={cn("text-cyan-300", isFetching && "animate-pulse")} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {liveAgents.length ? (
              liveAgents.map((agent) => (
                <div key={agent.user} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{agent.fullName}</p>
                      <p className="text-sm text-slate-300">{agent.campaignId} - {agent.callsToday} calls today</p>
                    </div>
                    <Badge variant={agent.status === "READY" ? "success" : agent.status === "PAUSED" ? "warning" : "secondary"}>
                      {agent.status}
                    </Badge>
                  </div>
                  {agent.pauseCode ? <p className="mt-2 text-xs text-amber-200">Pause code: {agent.pauseCode}</p> : null}
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No live agents are currently signed in.</p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/[0.92]">
          <CardHeader>
            <CardTitle>Classic Realtime Tools</CardTitle>
            <CardDescription>Use VICIDIAL realtime for the full legacy supervisor panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <LaunchGrid links={[legacyLinks.liveAgents, legacyLinks.reports]} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function VendorCostPage({ snapshot }: PageProps) {
  const rows = snapshot?.vendorCost ?? [];
  const spend = rows.reduce((total, row) => total + row.spend, 0);
  const billableEvents = rows.reduce((total, row) => total + row.billableEvents, 0);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Configured sources" value={String(rows.length)} />
        <SummaryCard label="Billable events" value={String(billableEvents)} />
        <SummaryCard label="Tracked spend" value={currency.format(spend)} />
      </section>
      <Card className="bg-white/[0.92]">
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Vendor Cost Report</CardTitle>
            <CardDescription>Saved vendor rules are live. Billable attribution math is the next reporting slice.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => downloadCsv("qdialer-vendor-cost.csv", vendorCsvRows(rows))}>
              Export CSV
            </Button>
            <Button asChild>
              <a href="#/sources">Manage Sources</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={vendorColumns} data={rows} emptyLabel="No vendor cost data yet." />
        </CardContent>
      </Card>
    </div>
  );
}

function AgentProductivityPage({ snapshot }: PageProps) {
  const rows = snapshot?.agentProductivity ?? [];
  const calls = rows.reduce((total, row) => total + row.calls, 0);
  const acquisitions = rows.reduce((total, row) => total + row.acquisitions, 0);
  const closeRate = calls ? (acquisitions / calls) * 100 : 0;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Tracked agents" value={String(rows.length)} />
        <SummaryCard label="Calls" value={String(calls)} />
        <SummaryCard label="Close rate" value={`${closeRate.toFixed(1)}%`} />
      </section>
      <Card className="bg-white/[0.92]">
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Agent Productivity Report</CardTitle>
            <CardDescription>Raw output plus efficiency views: close rate, talk time, and minutes per acquisition.</CardDescription>
          </div>
          <Button variant="secondary" onClick={() => downloadCsv("qdialer-agent-productivity.csv", agentCsvRows(rows))}>
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={agentColumns} data={rows} emptyLabel="No agent productivity data yet." />
        </CardContent>
      </Card>
    </div>
  );
}

function SourcesPage() {
  return (
    <div className="grid gap-6">
      <VendorRuleSetup />
      <Card className="bg-white/[0.92]">
        <CardHeader>
          <CardTitle>Source Administration</CardTitle>
          <CardDescription>Use VICI list tools for lead containers, then map qDialer cost rules here.</CardDescription>
        </CardHeader>
        <CardContent>
          <LaunchGrid links={[legacyLinks.lists, legacyLinks.leadLookup, legacyLinks.ingroups]} />
        </CardContent>
      </Card>
    </div>
  );
}

function RecordingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
      <Card className="bg-white/[0.92]">
        <CardHeader>
          <CardTitle>Recording Review Queue</CardTitle>
          <CardDescription>Native review actions are staged here: listen, tag, note, and attach outcomes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {["High CPA vendor calls", "New agent sale reviews", "Webhook lead quality audit"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-4">
              <span className="font-semibold">{item}</span>
              <Button variant="outline" size="sm" asChild>
                <a href={legacyLinks.recordingLookup.href}>Open lookup</a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="bg-white/[0.92]">
        <CardHeader>
          <CardTitle>Recording Tools</CardTitle>
          <CardDescription>Use the working VICIDIAL lookup until native qDialer playback lands.</CardDescription>
        </CardHeader>
        <CardContent>
          <LaunchGrid links={[legacyLinks.recordingLookup, legacyLinks.leadLookup]} />
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsPage({ snapshot }: PageProps) {
  const vendorRows = snapshot?.vendorCost ?? [];
  const agentRows = snapshot?.agentProductivity ?? [];

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard title="Vendor Cost" text="CPA, CPL, duration billing, bad lead outcomes." href="#/vendors" icon={WalletCards} />
        <ReportCard title="Agent Productivity" text="Calls, close rate, talk minutes, minutes per acquisition." href="#/agents" icon={Users} />
        <ReportCard title="Live Agents" text="Current floor state and classic realtime launch." href="#/live" icon={RadioTower} />
        <ReportCard title="Classic VICI Reports" text="Open the full legacy reports library." href={legacyLinks.reports.href} icon={BarChart3} />
      </section>
      <Card className="bg-white/[0.92]">
        <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Exports</CardTitle>
            <CardDescription>CSV exports are available for qDialer-native report tables.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => downloadCsv("qdialer-vendor-cost.csv", vendorCsvRows(vendorRows))}>Vendor CSV</Button>
            <Button variant="secondary" onClick={() => downloadCsv("qdialer-agent-productivity.csv", agentCsvRows(agentRows))}>Agent CSV</Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

function SetupPage({ health }: { health?: HealthResponse }) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DependencyCard label="Postgres" health={health?.dependencies.postgres} />
        <DependencyCard label="Redis" health={health?.dependencies.redis} />
        <DependencyCard label="VICI DB" health={health?.dependencies.vicidialDb} />
        <DependencyCard label="VICI API" health={health?.dependencies.vicidialApi} />
      </section>
      <Card className="bg-white/[0.92]">
        <CardHeader>
          <CardTitle>Next Setup Flows</CardTitle>
          <CardDescription>These are the native setup pages still needed for full agency reporting.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <SetupStep icon={WalletCards} title="Vendor rules" text="Live now for source cost setup." status="Ready" />
          <SetupStep icon={ClipboardList} title="Status mapping" text="Map SALE, bad lead, callback, and neutral outcomes." status="Next" />
          <SetupStep icon={ShieldCheck} title="Roles" text="Add qDialer role flags over VICIDIAL users." status="Planned" />
        </CardContent>
      </Card>
    </div>
  );
}

function AdvancedViciPage() {
  return (
    <div className="grid gap-6">
      <Card className="bg-white/[0.92]">
        <CardHeader>
          <CardTitle>Advanced VICIDIAL Launchpad</CardTitle>
          <CardDescription>These links open legacy VICIDIAL pages intentionally. qDialer keeps them visible, not hidden.</CardDescription>
        </CardHeader>
        <CardContent>
          <LaunchGrid links={dashboardLaunches.concat(legacyLinks.admin)} />
        </CardContent>
      </Card>
    </div>
  );
}

function UtilityPage({ links, steps }: { links: LaunchLink[]; steps: string[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <Card className="bg-white/[0.92]">
        <CardHeader>
          <CardTitle>Open Working Tools</CardTitle>
          <CardDescription>These actions go directly to the correct VICIDIAL workflow instead of dumping you on a generic page.</CardDescription>
        </CardHeader>
        <CardContent>
          <LaunchGrid links={links} />
        </CardContent>
      </Card>
      <Card className="bg-white/[0.92]">
        <CardHeader>
          <CardTitle>Recommended Flow</CardTitle>
          <CardDescription>Use this as the qDialer-native checklist for now.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {steps.map((step, index) => (
            <div key={step} className="flex gap-3 rounded-2xl border border-border bg-muted/40 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-cyan text-sm font-black text-brand-navy">
                {index + 1}
              </span>
              <p className="text-sm font-semibold leading-6">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LaunchGrid({ links }: { links: LaunchLink[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {links.map((link) => (
        <a
          key={`${link.title}-${link.href}`}
          href={link.href}
          className="group rounded-[1.35rem] border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-cyan/40 hover:shadow-glow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
                <link.icon />
              </span>
              <span>
                <span className="font-bold">{link.title}</span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">{link.description}</span>
              </span>
            </div>
            {link.badge ? <Badge variant="secondary">{link.badge}</Badge> : null}
          </div>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
            Open
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </a>
      ))}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-white/90">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ReportCard({ href, icon: Icon, text, title }: { href: string; icon: LucideIcon; text: string; title: string }) {
  return (
    <Card className="bg-white/[0.92]">
      <CardHeader>
        <Icon className="text-primary" />
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{text}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <a href={href}>
            Open
            <ArrowUpRight data-icon="inline-end" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function DependencyCard({ health, label }: { health?: DependencyHealth; label: string }) {
  const ok = Boolean(health?.ok);
  const configured = Boolean(health?.configured);
  const tone = ok ? "success" : configured ? "warning" : "secondary";

  return (
    <Card className="bg-white/90">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{label}</CardDescription>
          <Badge variant={tone}>{ok ? "OK" : configured ? "Check" : "Not set"}</Badge>
        </div>
        <CardTitle className="text-xl">{configured ? "Configured" : "Unconfigured"}</CardTitle>
        {health?.detail ? <p className="text-sm text-muted-foreground">{health.detail}</p> : null}
      </CardHeader>
    </Card>
  );
}

function SetupStep({ icon: Icon, status, text, title }: { icon: LucideIcon; status: string; text: string; title: string }) {
  return (
    <div className="rounded-[1.35rem] border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <Icon className="text-primary" />
        <Badge variant="secondary">{status}</Badge>
      </div>
      <p className="mt-3 font-bold">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}

function DarkMiniCard({ icon: Icon, text, title }: { icon: LucideIcon; text: string; title: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
      <Icon className="text-brand-cyan" />
      <p className="mt-3 font-bold">{title}</p>
      <p className="mt-1 text-sm leading-5 text-slate-300">{text}</p>
    </div>
  );
}
