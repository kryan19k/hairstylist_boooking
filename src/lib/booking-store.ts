"use client";
import { create } from "zustand";

type Draft = {
  serviceId: string | null;
  addonIds: string[];
  date: string | null;
  time: string | null;
  note: string;
  setService: (id: string | null, note?: string) => void;
  toggleAddon: (id: string) => void;
  setSlot: (date: string | null, time: string | null) => void;
  reset: () => void;
};

export const useBooking = create<Draft>((set) => ({
  serviceId: null,
  addonIds: [],
  date: null,
  time: null,
  note: "",
  // Changing service invalidates the chosen time (duration changes what fits).
  setService: (serviceId, note = "") => set({ serviceId, date: null, time: null, note }),
  toggleAddon: (id) =>
    set((s) => ({
      addonIds: s.addonIds.includes(id) ? s.addonIds.filter((a) => a !== id) : [...s.addonIds, id],
      date: null,
      time: null,
    })),
  setSlot: (date, time) => set({ date, time }),
  reset: () => set({ serviceId: null, addonIds: [], date: null, time: null, note: "" }),
}));
