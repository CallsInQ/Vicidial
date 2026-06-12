import { create } from "zustand";

type ShellState = {
  activeNav: string;
  commandOpen: boolean;
  setActiveNav: (activeNav: string) => void;
  setCommandOpen: (commandOpen: boolean) => void;
};

export const useShellStore = create<ShellState>((set) => ({
  activeNav: "dashboard",
  commandOpen: false,
  setActiveNav: (activeNav) => set({ activeNav }),
  setCommandOpen: (commandOpen) => set({ commandOpen })
}));
