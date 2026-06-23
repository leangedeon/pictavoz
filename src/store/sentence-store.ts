import { create } from "zustand";
import type { Pictogram } from "@/types";

interface SentenceState {
  items: Pictogram[];
  addItem: (item: Pictogram) => void;
  removeItem: (index: number) => void;
  reset: () => void;
}

export const useSentenceStore = create<SentenceState>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (index) =>
    set((state) => ({
      items: state.items.filter((_, i) => i !== index),
    })),
  reset: () => set({ items: [] }),
}));
