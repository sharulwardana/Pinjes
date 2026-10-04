import "server-only";
import { RateLimitError } from "./errors";

/**
 * Fixed-window in-memory rate limiter.
 *
 * Good enough for a single Node instance. For multi-instance deployments swap
 * the store for Redis (see README → Production). The interface stays the same.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const globalStore = globalThis as unknown as { __rsRateLimit?: Map<string, Bucket> };
const store = (globalStore.__rsRateLimit ??= new Map<string, Bucket>());

export interface RateLimitRule {
  /** Max hits per window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

export const RATE_LIMITS = {
  login: { limit: 8, windowSec: 15 * 60 },
  loginFailures: { limit: 5, windowSec: 15 * 60 },
  register: { limit: 5, windowSec: 60 * 60 },
  booking: { limit: 10, windowSec: 10 * 60 },
  upload: { limit: 20, windowSec: 10 * 60 },
  mutation: { limit: 60, windowSec: 60 },
} satisfies Record<string, RateLimitRule>;

function sweep(now: number) {
  if (store.size < 5_000) return;
  for (const [key, bucket] of store) if (bucket.resetAt <= now) store.delete(key);
}

/** Count a hit. Returns remaining hits; throws RateLimitError when exceeded. */
export function hit(key: string, rule: RateLimitRule, message?: string): number {
  const now = Date.now();
  sweep(now);
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + rule.windowSec * 1000 });
    return rule.limit - 1;
  }
  bucket.count += 1;
  if (bucket.count > rule.limit) throw new RateLimitError(message);
  return rule.limit - bucket.count;
}

/** Check without counting. */
export function isLimited(key: string, rule: RateLimitRule): boolean {
  const bucket = store.get(key);
  return !!bucket && bucket.resetAt > Date.now() && bucket.count >= rule.limit;
}

export function reset(key: string) {
  store.delete(key);
}

/** Test helper. */
export function __resetAllRateLimits() {
  store.clear();
}
