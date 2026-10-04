/**
 * Date-only helpers. A rental "day" is a calendar date in Asia/Jakarta,
 * represented as a "YYYY-MM-DD" key and stored in the DB as 00:00 UTC.
 * Safe to import on both server and client.
 */

export const APP_TIME_ZONE = "Asia/Jakarta";

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !KEY_RE.test(value)) return false;
  const d = parseDateKey(value);
  return !Number.isNaN(d.getTime()) && toDateKey(d) === value;
}

/** "2026-10-03" → Date at 2026-10-03T00:00:00.000Z */
export function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Date stored at UTC midnight → "YYYY-MM-DD" */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date key in Jakarta time. */
export function todayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDaysKey(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateKey(d);
}

/** Inclusive day count: 3 Oct → 5 Oct = 3 days. */
export function rentalDays(startKey: string, endKey: string): number {
  const ms = parseDateKey(endKey).getTime() - parseDateKey(startKey).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function eachDateKey(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  for (let k = startKey; k <= endKey; k = addDaysKey(k, 1)) out.push(k);
  return out;
}

/** Local Date (midnight in the browser's zone) for display / calendar math. */
export function keyToLocalDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function localDateToKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
