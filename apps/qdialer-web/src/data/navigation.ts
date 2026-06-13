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
  { id: "users", label: "Users", href: "#/users", icon: Users },
  { id: "leads", label: "Lead Lookup", href: "#/leads", icon: Search },
  { id: "recordings", label: "Recordings", href: "#/recordings", icon: Headphones },
  { id: "numbers", label: "Numbers", href: "#/numbers", icon: Phone },
  { id: "ingroups", label: "In-Groups", href: "#/ingroups", icon: Boxes },
  { id: "campaigns", label: "Campaigns", href: "#/campaigns", icon: ShieldCheck },
  { id: "sources", label: "Lists & Sources", href: "#/sources", icon: ListChecks },
  { id: "vendors", label: "Vendor Cost", href: "#/vendors", icon: WalletCards },
  { id: "agents", label: "Agent Productivity", href: "#/agents", icon: Users },
  { id: "reports", label: "Reports", href: "#/reports", icon: BarChart3 },
  { id: "setup", label: "Setup", href: "#/setup", icon: Settings },
  { id: "advanced", label: "Advanced VICIDIAL", href: "#/advanced", icon: ShieldCheck }
] as const;

export type NavigationItemId = (typeof navigationItems)[number]["id"];
