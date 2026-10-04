import "server-only";

type Level = "debug" | "info" | "warn" | "error";

const REDACT_KEYS = /pass(word)?|token|secret|authorization|cookie|session|proof|qris|account_?number/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: process.env.NODE_ENV === "production" ? undefined : value.stack };
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = REDACT_KEYS.test(k) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

function write(level: Level, message: string, context?: Record<string, unknown>) {
  const isProd = process.env.NODE_ENV === "production";
  if (level === "debug" && isProd) return;
  const safe = context ? (redact(context) as Record<string, unknown>) : undefined;
  if (isProd) {
    // Structured single-line JSON for log collectors.
    console[level === "debug" ? "log" : level](
      JSON.stringify({ level, message, time: new Date().toISOString(), ...safe }),
    );
  } else {
    console[level === "debug" ? "log" : level](`[${level}] ${message}`, safe ?? "");
  }
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => write("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => write("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => write("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => write("error", m, c),
};
