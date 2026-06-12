import {
  BarChart3,
  Boxes,
  Headphones,
  LayoutDashboard,
  ListChecks,
  RadioTower,
  Settings,
  ShieldCheck,
  Users,
  WalletCards
} from "lucide-react";

export const navigationItems = [
  { id: "dashboard", label: "Command Center", href: "#dashboard", icon: LayoutDashboard },
  { id: "live", label: "Live Agents", href: "#live", icon: RadioTower },
  { id: "vendors", label: "Vendor Cost", href: "#vendors", icon: WalletCards },
  { id: "agents", label: "Agent Productivity", href: "#agents", icon: Users },
  { id: "recordings", label: "Recording Review", href: "#recordings", icon: Headphones },
  { id: "sources", label: "Lists & Sources", href: "#sources", icon: ListChecks },
  { id: "ingroups", label: "In-Groups", href: "#ingroups", icon: Boxes },
  { id: "reports", label: "Reports", href: "#reports", icon: BarChart3 },
  { id: "setup", label: "Setup", href: "#setup", icon: Settings },
  { id: "advanced", label: "Advanced VICIDIAL", href: "/vicidial/admin.php", icon: ShieldCheck }
] as const;
