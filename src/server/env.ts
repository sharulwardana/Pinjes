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
  get uploadDir() {
    return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "storage/uploads");
  },
  get uploadMaxBytes() {
    const mb = Number(process.env.UPLOAD_MAX_MB ?? "5");
    return (Number.isFinite(mb) && mb > 0 ? mb : 5) * 1024 * 1024;
  },
};
