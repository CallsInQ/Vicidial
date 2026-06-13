import {
  BarChart3,
  Boxes,
  Headphones,
  LayoutDashboard,
  ListChecks,
  Phone,
  RadioTower,
  Search,
  Settings,
  ShieldCheck,
  Users,
  WalletCards
} from "lucide-react";

export const navigationItems = [
  { id: "dashboard", label: "Command Center", href: "#/dashboard", icon: LayoutDashboard },
  { id: "live", label: "Live Agents", href: "#/live", icon: RadioTower },
  { id: "reports", label: "Reports", href: "#/reports", icon: BarChart3 },
  { id: "sources", label: "Lists & Sources", href: "#/sources", icon: ListChecks },
  { id: "ingroups", label: "In-Groups", href: "#/ingroups", icon: Boxes },
  { id: "numbers", label: "Numbers", href: "#/numbers", icon: Phone },
  { id: "campaigns", label: "Campaigns", href: "#/campaigns", icon: ShieldCheck },
  { id: "vendors", label: "Vendor Costs", href: "#/vendors", icon: WalletCards },
  { id: "leads", label: "Lead Lookup", href: "#/leads", icon: Search },
  { id: "recordings", label: "Recordings", href: "#/recordings", icon: Headphones },
  { id: "users", label: "Users", href: "#/users", icon: Users },
  { id: "setup", label: "Setup", href: "#/setup", icon: Settings },
  { id: "advanced", label: "Advanced Admin", href: "#/advanced", icon: ShieldCheck }
] as const;

export const pageIds = [
  "dashboard",
  "live",
  "reports",
  "sources",
  "ingroups",
  "numbers",
  "campaigns",
  "vendors",
  "leads",
  "recordings",
  "users",
  "agents",
  "setup",
  "advanced"
] as const;

export type NavigationItemId = (typeof pageIds)[number];
