import { useQuery } from "@tanstack/react-query";
import type { AgentProductivityRow, VendorCostRow } from "@qdialer/shared";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  ArrowUpRight,
  Command,
  Headphones,
  type LucideIcon,
  RadioTower,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommandMenu } from "@/components/command-menu";
import { DataTable } from "@/components/data-table";
import { navigationItems } from "@/data/navigation";
import { fetchDashboardSnapshot } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useShellStore } from "@/stores/use-shell-store";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const assetBase = import.meta.env.BASE_URL;
const iconSrc = `${assetBase}qdialer-favicon.png`;

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

export function App() {
  const { data, isFetching } = useQuery({
    queryKey: ["dashboard-snapshot"],
    queryFn: fetchDashboardSnapshot,
    refetchInterval: 20_000
  });
  const activeNav = useShellStore((state) => state.activeNav);
  const setActiveNav = useShellStore((state) => state.setActiveNav);
  const setCommandOpen = useShellStore((state) => state.setCommandOpen);

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen qd-shell-grid">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-brand-cyan/20 bg-brand-navy p-5 text-slate-200 shadow-2xl lg:block">
          <a className="mb-6 flex items-center gap-3 rounded-[1.5rem] border border-brand-cyan/20 bg-white/5 p-3 text-white shadow-inner shadow-white/5" href="#dashboard">
            <img src={iconSrc} alt="" className="h-12 w-12 rounded-2xl border border-brand-cyan/40 shadow-lg shadow-brand-cyan/15" />
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-black tracking-tight">qDialer</span>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">Command</span>
            </span>
          </a>
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
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-5 overflow-hidden rounded-[1.75rem] border border-brand-cyan/20 bg-brand-navy p-5 text-white shadow-glow backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 p-2 pr-5">
                <img src={iconSrc} alt="" className="h-12 w-12 rounded-2xl border border-brand-cyan/40 shadow-lg shadow-brand-cyan/15" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xl font-black tracking-tight text-white">qDialer</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">Command Center</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-brand-cyan">qDialer Command Center</p>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">Agency decisions without the VICI maze.</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setCommandOpen(true)}>
                <Command data-icon="inline-start" />
                Command
              </Button>
              <Button asChild>
                <a href="/vicidial/admin.php">
                  Advanced VICI
                  <ArrowUpRight data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </header>

          <section id="dashboard" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(data?.metrics ?? []).map((metric) => (
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

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card id="vendors" className="bg-white/[0.92]">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Vendor Cost Report</CardTitle>
                  <CardDescription>CPA, CPL, duration billing, bad lead rate, and source attribution in one table.</CardDescription>
                </div>
                <WalletBadge />
              </CardHeader>
              <CardContent>
                <DataTable columns={vendorColumns} data={data?.vendorCost ?? []} emptyLabel="No vendor cost data yet." />
              </CardContent>
            </Card>

            <Card id="live" className="overflow-hidden bg-brand-navy text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Floor</CardTitle>
                    <CardDescription className="text-slate-300">Realtime VICI status will stream through SSE.</CardDescription>
                  </div>
                  <RadioTower className={cn("text-cyan-300", isFetching && "animate-pulse")} />
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {(data?.liveAgents ?? []).map((agent) => (
                  <div key={agent.user} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{agent.fullName}</p>
                        <p className="text-sm text-slate-300">{agent.campaignId} - {agent.callsToday} calls</p>
                      </div>
                      <Badge variant={agent.status === "READY" ? "success" : agent.status === "PAUSED" ? "warning" : "secondary"}>
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <Card id="agents" className="bg-white/[0.92]">
              <CardHeader>
                <CardTitle>Agent Productivity Report</CardTitle>
                <CardDescription>Raw output plus efficiency views: close rate, talk time, and minutes per acquisition.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={agentColumns} data={data?.agentProductivity ?? []} emptyLabel="No agent productivity data yet." />
              </CardContent>
            </Card>

            <Card id="recordings" className="bg-white/[0.92]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recording Review Queue</CardTitle>
                    <CardDescription>Next native workflow: listen, tag, note, and attach review outcomes.</CardDescription>
                  </div>
                  <Headphones className="text-primary" />
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                {["High CPA vendor calls", "New agent sale reviews", "Webhook lead quality audit"].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 p-4">
                    <span className="font-semibold">{item}</span>
                    <Button variant="outline" size="sm">Open</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <NextStepCard icon={Activity} title="VICI connector" text="Read-only DB access for reporting, API connector for controlled writes." />
            <NextStepCard icon={ShieldCheck} title="Audit-first actions" text="Every qDialer change writes audit context before touching VICI state." />
            <NextStepCard icon={Sparkles} title="Native workflows" text="Replace the pages managers use most, keep legacy pages as advanced fallback." />
          </section>
        </main>
      </div>
      <CommandMenu />
    </div>
  );
}

function WalletBadge() {
  return <Badge variant="secondary">Highest billable event wins</Badge>;
}

function NextStepCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <Card className="bg-white/[0.82]">
      <CardHeader>
        <Icon className="text-primary" />
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{text}</CardDescription>
      </CardHeader>
    </Card>
  );
}
