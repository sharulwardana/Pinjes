import "server-only";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Deteksi driver: SQLite (local/dev) atau PostgreSQL (production)
const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const isPostgres = connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://");

const adapter = isPostgres ? undefined : new PrismaBetterSqlite3({ url: connectionString });

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(adapter ? { adapter } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/** Either the root client or an interactive-transaction client. */
export type Tx = Prisma.TransactionClient;

/** Interactive transaction with sane limits for SQLite/Postgres. */
export const TX_OPTIONS = { maxWait: 10_000, timeout: 15_000 } as const;
