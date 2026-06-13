import { create } from "zustand";
import type { NavigationItemId } from "@/data/navigation";

type ShellState = {
  activeNav: NavigationItemId;
  commandOpen: boolean;
  setActiveNav: (activeNav: NavigationItemId) => void;
  setCommandOpen: (commandOpen: boolean) => void;
};

export const useShellStore = create<ShellState>((set) => ({
  activeNav: "dashboard",
  commandOpen: false,
  setActiveNav: (activeNav) => set({ activeNav }),
  setCommandOpen: (commandOpen) => set({ commandOpen })
}));
