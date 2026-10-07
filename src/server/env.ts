import "server-only";
import path from "node:path";

/**
 * Typed access to server environment variables. Values are read lazily so the
 * build never bakes runtime configuration into bundles.
 */
export const env = {
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
  get appUrl() {
    return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  },
  /**
   * Jumlah reverse proxy tepercaya di depan app (Nginx, Cloudflare, Vercel, dll).
   * Dipakai untuk membaca IP klien dari X-Forwarded-For. 0 = abaikan header tersebut.
   */
  get trustedProxyHops() {
    const n = Number(process.env.TRUSTED_PROXY_HOPS ?? "1");
    return Number.isInteger(n) && n >= 0 ? n : 1;
  },
  get uploadDir() {
    return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR ?? "storage/uploads");
  },
  get uploadMaxBytes() {
    const mb = Number(process.env.UPLOAD_MAX_MB ?? "5");
    return (Number.isFinite(mb) && mb > 0 ? mb : 5) * 1024 * 1024;
  },
};
