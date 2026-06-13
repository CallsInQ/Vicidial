import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Search } from "lucide-react";
import { navigationItems } from "@/data/navigation";
import { Input } from "@/components/ui/input";
import { useShellStore } from "@/stores/use-shell-store";

export function CommandMenu() {
  const open = useShellStore((state) => state.commandOpen);
  const setOpen = useShellStore((state) => state.setCommandOpen);
  const setActiveNav = useShellStore((state) => state.setActiveNav);

  return (
    <Dialog open={open} onClose={setOpen} className="relative z-50">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-start justify-center p-4 pt-24">
        <DialogPanel className="w-full max-w-2xl rounded-[1.5rem] border border-border bg-card p-4 shadow-glow">
          <DialogTitle className="sr-only">qDialer command menu</DialogTitle>
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Search className="text-muted-foreground" data-icon="inline-start" />
            <Input autoFocus placeholder="Search qDialer pages, reports, and setup..." className="border-0 shadow-none focus-visible:ring-0" />
          </div>
          <div className="grid gap-2 pt-4">
            {navigationItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold hover:bg-accent"
                onClick={() => {
                  setActiveNav(item.id);
                  setOpen(false);
                }}
              >
                <item.icon className="text-primary" data-icon="inline-start" />
                {item.label}
              </a>
            ))}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
