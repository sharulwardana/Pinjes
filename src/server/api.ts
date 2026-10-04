import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { Prisma, type RoleKey } from "@prisma/client";
import { ZodError, type ZodType } from "zod";
import { env } from "./env";
import { AppError, ForbiddenError, UnauthorizedError, ValidationError } from "./errors";
import { logger } from "./logger";
import { hit, RATE_LIMITS, type RateLimitRule } from "./rate-limit";
import { getCurrentUser, getRequestMeta } from "./session";
import { getSettings } from "./settings";
import type { RequestMeta, SessionUser } from "./services/auth";

/**
 * The single entry point for every REST handler:
 *   CSRF origin check → auth → role → rate limit → handler → consistent JSON.
 *
 * Success: { data, message }   Error: { message, errors }
 */

export interface ApiContext<P> {
  req: NextRequest;
  user: SessionUser | null;
  meta: RequestMeta;
  params: P;
}

export interface AuthedApiContext<P> extends ApiContext<P> {
  user: SessionUser;
}

interface Options {
  auth?: boolean;
  roles?: RoleKey[];
  rateLimit?: RateLimitRule & { key?: string };
}

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function ok<T>(data: T, message = "Berhasil.", status = 200) {
  return NextResponse.json({ data, message }, { status });
}

export function fail(message: string, status = 400, errors: Record<string, string[]> = {}) {
  return NextResponse.json({ message, errors }, { status });
}

function zodToErrors(error: ZodError) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

export function parseWith<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ValidationError(zodToErrors(result.error));
  return result.data;
}

export async function readJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new AppError("Format data tidak valid.", 400, "BAD_JSON");
  }
  return parseWith(schema, body);
}

export async function readForm(req: NextRequest): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    throw new AppError("Format data tidak valid.", 400, "BAD_FORM");
  }
}

/** Plain object of the string fields of a FormData (files excluded). */
export function formFields(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

function checkOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowed = new Set([env.appUrl, req.nextUrl.origin]);
  if (origin) {
    if (!allowed.has(origin)) throw new ForbiddenError("Permintaan ditolak (origin tidak dikenal).");
    return;
  }
  // No Origin header (some same-origin navigations): fall back to Referer, otherwise
  // require the fetch metadata header that browsers always send on same-origin fetch.
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      if (!allowed.has(new URL(referer).origin)) throw new Error("bad referer");
      return;
    } catch {
      throw new ForbiddenError("Permintaan ditolak (origin tidak dikenal).");
    }
  }
  if (req.headers.get("sec-fetch-site") === "same-origin") return;
  throw new ForbiddenError("Permintaan ditolak (origin tidak dikenal).");
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) return fail(error.message, error.status, error.errors);
  if (error instanceof ZodError) return fail("Periksa kembali data yang kamu isi.", 422, zodToErrors(error));
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return fail("Data yang sama sudah ada.", 409);
    if (error.code === "P2025") return fail("Data tidak ditemukan.", 404);
  }
  logger.error("unhandled api error", { error });
  return fail("Data belum dapat diproses. Coba lagi beberapa saat lagi.", 500);
}

type RouteCtx = { params: Promise<Record<string, string | string[]>> };

export function route<P = Record<string, string>>(
  options: Options & { auth: true },
  handler: (ctx: AuthedApiContext<P>) => Promise<Response>,
): (req: NextRequest, ctx: RouteCtx) => Promise<Response>;
export function route<P = Record<string, string>>(
  options: Options,
  handler: (ctx: ApiContext<P>) => Promise<Response>,
): (req: NextRequest, ctx: RouteCtx) => Promise<Response>;
export function route<P>(options: Options, handler: any) {
  return async (req: NextRequest, ctx: RouteCtx) => {
    try {
      const mutating = MUTATING.has(req.method);
      if (mutating) checkOrigin(req);

      const [user, meta] = await Promise.all([getCurrentUser(), getRequestMeta()]);
      if ((options.auth || options.roles) && !user) throw new UnauthorizedError();
      if (options.roles && user && !options.roles.includes(user.role)) throw new ForbiddenError();

      if (mutating) {
        const settings = await getSettings();
        if (settings.maintenance_mode && user?.role !== "ADMIN" && !req.nextUrl.pathname.startsWith("/api/auth/")) {
          throw new AppError("PinjeS sedang dalam pemeliharaan. Coba lagi beberapa saat lagi.", 503, "MAINTENANCE");
        }
        const rule = options.rateLimit ?? RATE_LIMITS.mutation;
        const who = user?.id ?? meta.ip ?? "anon";
        hit(`${options.rateLimit?.key ?? "mut"}:${who}`, rule);
      }

      const params = ((await ctx?.params) ?? {}) as P;
      return await handler({ req, user, meta, params });
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
