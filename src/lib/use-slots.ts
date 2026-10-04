"use client";
import { useMemo } from "react";
import { useContent } from "@/components/ContentProvider";
import { buildStaff } from "./staff";
import type { Busy, SlotOpts } from "./availability";

/** Booking rules from the owner's settings + who works + days off + currently-busy times (optionally live). */
export function useSlotOpts(busyOverride?: Busy[]): Omit<SlotOpts, "now"> {
  const { settings, team, busy, timeOff, live } = useContent();
  return useMemo(
    () => ({
      hours: settings.hours,
      step: settings.slotStepMinutes,
      leadHours: settings.leadHours,
      busy: busyOverride ?? busy,
      demo: !live,
      staff: buildStaff(settings, team),
      timeOff,
    }),
    [settings, team, busy, timeOff, busyOverride, live],
  );
}
