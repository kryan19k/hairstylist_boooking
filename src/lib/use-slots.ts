"use client";
import { useMemo } from "react";
import { useContent } from "@/components/ContentProvider";
import type { Busy, SlotOpts } from "./availability";

/** Booking rules from the owner's settings + currently-busy times (optionally overridden with live data). */
export function useSlotOpts(busyOverride?: Busy[]): Omit<SlotOpts, "now"> {
  const { settings, busy, live } = useContent();
  return useMemo(
    () => ({ hours: settings.hours, step: settings.slotStepMinutes, leadHours: settings.leadHours, busy: busyOverride ?? busy, demo: !live }),
    [settings, busy, busyOverride, live],
  );
}
