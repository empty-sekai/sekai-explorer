// Numbers as the interface language writes them.

import { getLocale } from "~/paraglide/runtime.js";

const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

/** A size in bytes, in the largest unit that keeps it at least 1. */
export function bytes(size: number): string {
  const step = Math.min(UNITS.length - 1, Math.floor(Math.log(Math.max(size, 1)) / Math.log(1024)));
  return new Intl.NumberFormat(getLocale(), {
    style: "unit",
    unit: UNITS[step],
    unitDisplay: "short",
    maximumFractionDigits: step === 0 ? 0 : 1,
  }).format(size / 1024 ** step);
}

export function count(value: number): string {
  return new Intl.NumberFormat(getLocale()).format(value);
}

/** The first characters of a hash, enough to tell values apart at a glance. */
export function short(hash: string): string {
  return hash.slice(0, 12);
}
