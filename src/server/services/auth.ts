import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { RoleKey } from "@prisma/client";
import { db } from "../db";
import { audit } from "../audit";
import { AppError, UnauthorizedError } from "../errors";
import { hit, isLimited, RATE_LIMITS, reset } from "../rate-limit";
import { logger } from "../logger";
import type { LoginInput, RegisterInput } from "@/features/auth/schemas";
import { slugify } from "@/lib/utils";

export const SESSION_TTL_DAYS = 30;
const BCRYPT_ROUNDS = 12;
// Used to keep timing similar when the email does not exist.
let dummyHash: Promise<string> | null = null;
function getDummyHash() {
  return (dummyHash ??= bcrypt.hash(randomBytes(16).toString("hex"), BCRYPT_ROUNDS));
}

export interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: RoleKey;
  storeId: string | null;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function uniqueStoreSlug(base: string) {
  const root = slugify(base) || "toko";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const exists = await db.store.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  return `${root}-${randomBytes(3).toString("hex")}`;
}

export async function registerUser(input: RegisterInput, meta: RequestMeta = {}) {
  hit(`register:${meta.ip ?? "unknown"}`, RATE_LIMITS.register);

  const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    throw new AppError("Email ini sudah terdaftar. Silakan masuk.", 409, "EMAIL_TAKEN", {
      email: ["Email ini sudah terdaftar."],
    });
  }

  // Role is derived on the server. Nobody can register as ADMIN.
  const roleKey: RoleKey = input.accountType === "owner" ? "STORE_OWNER" : "CUSTOMER";
  const passwordHash = await hashPassword(input.password);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name: input.name, email: input.email, passwordHash, roleKey },
    });
    if (roleKey === "STORE_OWNER") {
      const storeName = `Toko ${input.name.split(" ")[0]}`;
      await tx.store.create({
        data: { ownerId: created.id, name: storeName, slug: await uniqueStoreSlug(`${storeName}-${created.id.slice(-4)}`) },
      });
    }
    await audit(
      { actorId: created.id, action: "auth.register", entityType: "user", entityId: created.id, metadata: { roleKey }, ipAddress: meta.ip },
      tx,
    );
    return created;
  });

  return user;
}

export async function authenticate(input: LoginInput, meta: RequestMeta = {}) {
  const ip = meta.ip ?? "unknown";
  const failKey = `login-fail:${input.email}`;
  hit(`login:${ip}`, RATE_LIMITS.login);

  if (isLimited(failKey, RATE_LIMITS.loginFailures)) {
    throw new AppError(
      "Terlalu banyak percobaan masuk yang gagal. Coba lagi dalam 15 menit.",
      429,
      "LOGIN_THROTTLED",
    );
  }

  const user = await db.user.findUnique({ where: { email: input.email } });
  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !ok || user.deletedAt) {
    try {
      hit(failKey, RATE_LIMITS.loginFailures);
    } catch {
      /* the next attempt will be blocked by isLimited above */
    }
    await audit({
      actorId: user?.id ?? null,
      action: "auth.login_failed",
      entityType: "user",
      entityId: user?.id ?? null,
      ipAddress: meta.ip,
    });
    logger.warn("login failed", { ip });
    throw new AppError("Email atau password salah.", 401, "INVALID_CREDENTIALS", {
      password: ["Email atau password salah."],
    });
  }

  if (user.status === "SUSPENDED") {
    throw new AppError(
      "Akun ini sedang dinonaktifkan. Hubungi tim PinjeS untuk informasi lebih lanjut.",
      403,
      "ACCOUNT_SUSPENDED",
    );
  }

  reset(failKey);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit({ actorId: user.id, action: "auth.login", entityType: "user", entityId: user.id, ipAddress: meta.ip });
  return user;
}

export async function createSession(userId: string, meta: RequestMeta = {}) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await db.session.create({
    data: {
      id: hashToken(token),
      userId,
      expiresAt,
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
    },
  });
  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string): Promise<SessionUser | null> {
  if (!token || token.length > 128) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { include: { store: { select: { id: true } } } } },
  });
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await db.session.delete({ where: { id: session.id } }).catch(() => { });
    return null;
  }
  const { user } = session;
  if (user.status !== "ACTIVE" || user.deletedAt) return null;

  // Sliding activity marker, written at most once per hour.
  if (now - session.lastSeenAt.getTime() > 3_600_000) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => { });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.roleKey,
    storeId: user.store?.id ?? null,
  };
}

export async function revokeSession(token: string, meta: RequestMeta = {}) {
  const id = hashToken(token);
  const session = await db.session.findUnique({ where: { id }, select: { userId: true } });
  if (!session) return;
  await db.session.delete({ where: { id } });
  await audit({ actorId: session.userId, action: "auth.logout", entityType: "user", entityId: session.userId, ipAddress: meta.ip });
}

export async function revokeAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

export function assertAuthenticated(user: SessionUser | null): asserts user is SessionUser {
  if (!user) throw new UnauthorizedError();
}

