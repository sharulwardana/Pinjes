import "server-only";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { env } from "./env";
import { ValidationError } from "./errors";
import { getStorage } from "./storage";

/**
 * Upload kinds. Public kinds are served to anyone; private kinds go through an
 * authorization check in /api/files (see `canReadFile`).
 */
export const UPLOAD_KINDS = {
  product: { public: true, types: ["jpg", "png", "webp"] },
  "store-logo": { public: true, types: ["jpg", "png", "webp"] },
  "store-cover": { public: true, types: ["jpg", "png", "webp"] },
  review: { public: true, types: ["jpg", "png", "webp"] },
  qris: { public: false, types: ["jpg", "png", "webp"] },
  "payment-proof": { public: false, types: ["jpg", "png", "webp", "pdf"] },
  "deposit-proof": { public: false, types: ["jpg", "png", "webp", "pdf"] },
  "store-doc": { public: false, types: ["jpg", "png", "webp", "pdf"] },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;
type FileType = "jpg" | "png" | "webp" | "pdf";

const MIME: Record<FileType, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

const EXT_ALIASES: Record<string, FileType> = { jpg: "jpg", jpeg: "jpg", png: "png", webp: "webp", pdf: "pdf" };

/** Detect the real type from magic bytes. The browser-reported MIME is never trusted alone. */
export function sniffType(buf: Uint8Array): FileType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "png";
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "webp";
  if (buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d) return "pdf";
  return null;
}

export interface StoredFile {
  path: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

const typeLabel = (types: readonly string[]) => types.map((t) => t.toUpperCase()).join(", ");

/**
 * Validate (extension + MIME + magic bytes + size) and store a file under a random name.
 * The original filename is never used for storage.
 */
export async function saveUpload(file: unknown, kind: UploadKind, field = "file"): Promise<StoredFile> {
  if (!(file instanceof File) || file.size === 0) {
    throw new ValidationError({ [field]: ["Pilih file terlebih dahulu."] });
  }
  const spec = UPLOAD_KINDS[kind];
  const allowed = spec.types as readonly FileType[];
  const max = env.uploadMaxBytes;

  if (file.size > max) {
    throw new ValidationError({ [field]: [`Ukuran file maksimal ${Math.round(max / 1024 / 1024)} MB.`] });
  }

  const ext = EXT_ALIASES[file.name.split(".").pop()?.toLowerCase() ?? ""];
  if (!ext || !allowed.includes(ext)) {
    throw new ValidationError({ [field]: [`Format file harus ${typeLabel(allowed)}.`] });
  }
  if (file.type && file.type !== MIME[ext]) {
    throw new ValidationError({ [field]: [`Format file harus ${typeLabel(allowed)}.`] });
  }

  const buf = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffType(buf);
  if (!sniffed || sniffed !== ext) {
    throw new ValidationError({ [field]: ["Isi file tidak sesuai dengan formatnya."] });
  }

  const name = `${randomUUID()}.${sniffed}`;
  const relativePath = `${kind}/${name}`;
  await getStorage().save(relativePath, buf, MIME[sniffed]);

  return {
    path: relativePath,
    mimeType: MIME[sniffed],
    sizeBytes: buf.length,
    sha256: createHash("sha256").update(buf).digest("hex"),
  };
}

const PATH_RE = /^([a-z-]+)\/([0-9a-f-]{36})\.(jpg|png|webp|pdf)$/;

/** Resolve a stored relative path safely (no traversal). */
export function resolveUploadPath(relative: string): { kind: UploadKind; abs: string; type: FileType } | null {
  const m = PATH_RE.exec(relative);
  if (!m || !(m[1] in UPLOAD_KINDS)) return null;
  return { kind: m[1] as UploadKind, abs: path.join(/*turbopackIgnore: true*/ env.uploadDir, m[1], `${m[2]}.${m[3]}`), type: m[3] as FileType };
}

export async function readUpload(relative: string) {
  const resolved = resolveUploadPath(relative);
  if (!resolved) return null;
  try {
    const file = await getStorage().read(relative, MIME[resolved.type]);
    if (!file) return null;
    return { buf: file.buf, mimeType: file.mimeType, kind: resolved.kind, mtime: file.mtime };
  } catch {
    return null;
  }
}

export async function deleteUpload(relative: string | null | undefined) {
  if (!relative) return;
  const resolved = resolveUploadPath(relative);
  if (!resolved) return;
  await getStorage().delete(relative);
}
