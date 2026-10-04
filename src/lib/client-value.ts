"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Hydration-safe client-only value (dates, "now"). `get` must return a primitive. */
export function useClientValue<T extends string | number | boolean | null>(get: () => T, fallback: T): T {
  return useSyncExternalStore(noop, get, () => fallback);
}
