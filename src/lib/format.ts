/**
 * Central formatters. Every monetary or date value in the UI goes through here.
 */
import { formatDistanceToNowStrict } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { APP_TIME_ZONE, keyToLocalDate, toDateKey } from "./dates";

const numberFmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** 250000 → "Rp250.000", -5000 → "−Rp5.000" */
export function formatRupiah(amount: number): string {
  const abs = numberFmt.format(Math.abs(Math.trunc(amount)));
  return amount < 0 ? `−Rp${abs}` : `Rp${abs}`;
}

/** Signed ledger amount: "+ Rp50.000" / "− Rp5.000" */
export function formatSignedRupiah(amount: number): string {
  const abs = numberFmt.format(Math.abs(Math.trunc(amount)));
  return amount < 0 ? `− Rp${abs}` : `+ Rp${abs}`;
}

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type DateInput = Date | string;

function toKey(input: DateInput): string {
  return typeof input === "string" ? input.slice(0, 10) : toDateKey(input);
}

/** Calendar date (date-only) → "3 Oktober 2026" */
export function formatDate(input: DateInput, opts: { short?: boolean } = {}): string {
  const d = keyToLocalDate(toKey(input));
  const month = opts.short ? MONTHS_SHORT[d.getMonth()] : MONTHS[d.getMonth()];
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

/** "3–5 Oktober 2026", "30 September – 2 Oktober 2026", "30 Des 2026 – 2 Jan 2027" */
export function formatDateRange(start: DateInput, end: DateInput, opts: { short?: boolean } = {}): string {
  const s = keyToLocalDate(toKey(start));
  const e = keyToLocalDate(toKey(end));
  const names = opts.short ? MONTHS_SHORT : MONTHS;
  if (toKey(start) === toKey(end)) return formatDate(start, opts);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${names[s.getMonth()]} ${s.getFullYear()}`;
  }
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} ${names[s.getMonth()]} – ${e.getDate()} ${names[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${formatDate(start, opts)} – ${formatDate(end, opts)}`;
}

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateShortFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Timestamp → "03 Okt 2026, 14.05" (WIB) */
export function formatDateTime(date: Date | string): string {
  return dateTimeFmt.format(new Date(date));
}

/** Timestamp → "03 Okt 2026" (WIB) */
export function formatTimestampDate(date: Date | string): string {
  return dateShortFmt.format(new Date(date));
}

/** "5 menit lalu" */
export function formatRelative(date: Date | string): string {
  return `${formatDistanceToNowStrict(new Date(date), { locale: localeId })} lalu`;
}

export function formatDays(n: number): string {
  return `${n} hari`;
}
