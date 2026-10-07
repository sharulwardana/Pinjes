import "server-only";
import { mkdir, unlink, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { env } from "../env";
import { logger } from "../logger";

export interface StorageFile {
  buf: Buffer;
  mimeType: string;
  mtime: Date;
}

export interface StorageProvider {
  name: string;
  save(relativePath: string, buf: Uint8Array, mimeType: string): Promise<void>;
  read(relativePath: string, mimeType: string): Promise<StorageFile | null>;
  delete(relativePath: string): Promise<void>;
  getPublicUrl(relativePath: string): string;
}

/**
 * Driver penyimpanan disk lokal (default untuk pengembangan).
 */
class LocalDiskStorageProvider implements StorageProvider {
  name = "local";

  private getAbsPath(relativePath: string): string {
    return path.join(env.uploadDir, relativePath);
  }

  async save(relativePath: string, buf: Uint8Array): Promise<void> {
    const absPath = this.getAbsPath(relativePath);
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, buf, { flag: "wx" });
  }

  async read(relativePath: string, mimeType: string): Promise<StorageFile | null> {
    const absPath = this.getAbsPath(relativePath);
    try {
      const [buf, info] = await Promise.all([readFile(absPath), stat(absPath)]);
      return { buf, mimeType, mtime: info.mtime };
    } catch {
      return null;
    }
  }

  async delete(relativePath: string): Promise<void> {
    const absPath = this.getAbsPath(relativePath);
    await unlink(absPath).catch(() => {});
  }

  getPublicUrl(relativePath: string): string {
    return `/api/files/${relativePath}`;
  }
}

/**
 * Driver penyimpanan Cloud S3 / Cloudflare R2 / Supabase Storage.
 * Aktif jika STORAGE_DRIVER=s3 dan kredensial S3 lengkap di .env.
 */
class S3StorageProvider implements StorageProvider {
  name = "s3";
  private bucket: string;
  private endpoint: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "";
    this.endpoint = (process.env.S3_ENDPOINT ?? "").replace(/\/+$/, "");
    this.publicUrl = (process.env.S3_PUBLIC_URL ?? "").replace(/\/+$/, "");
  }

  async save(relativePath: string, buf: Uint8Array, mimeType: string): Promise<void> {
    if (!this.bucket || !this.endpoint) {
      logger.warn("S3_BUCKET / S3_ENDPOINT belum diatur. Menyimpan ke disk lokal fallback.");
      return new LocalDiskStorageProvider().save(relativePath, buf);
    }

    try {
      const targetUrl = `${this.endpoint}/${this.bucket}/${relativePath}`;
      const res = await fetch(targetUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType,
          ...(process.env.S3_ACCESS_KEY_ID
            ? { "x-amz-access-key": process.env.S3_ACCESS_KEY_ID }
            : {}),
        },
        body: Buffer.from(buf),
      });

      if (!res.ok) {
        throw new Error(`S3 PUT gagal dengan status ${res.status}`);
      }
    } catch (err) {
      logger.error("Gagal mengunggah file ke S3/R2:", { error: String(err) });
      // Fallback lokal agar unggahan tidak gagal total
      await new LocalDiskStorageProvider().save(relativePath, buf);
    }
  }

  async read(relativePath: string, mimeType: string): Promise<StorageFile | null> {
    if (!this.bucket || !this.endpoint) {
      return new LocalDiskStorageProvider().read(relativePath, mimeType);
    }

    try {
      const targetUrl = `${this.endpoint}/${this.bucket}/${relativePath}`;
      const res = await fetch(targetUrl);
      if (!res.ok) return new LocalDiskStorageProvider().read(relativePath, mimeType);

      const arrayBuf = await res.arrayBuffer();
      const lastModified = res.headers.get("last-modified");

      return {
        buf: Buffer.from(arrayBuf),
        mimeType,
        mtime: lastModified ? new Date(lastModified) : new Date(),
      };
    } catch {
      return new LocalDiskStorageProvider().read(relativePath, mimeType);
    }
  }

  async delete(relativePath: string): Promise<void> {
    if (!this.bucket || !this.endpoint) {
      return new LocalDiskStorageProvider().delete(relativePath);
    }

    try {
      const targetUrl = `${this.endpoint}/${this.bucket}/${relativePath}`;
      await fetch(targetUrl, { method: "DELETE" });
    } catch {
      await new LocalDiskStorageProvider().delete(relativePath);
    }
  }

  getPublicUrl(relativePath: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${relativePath}`;
    }
    return `/api/files/${relativePath}`;
  }
}

/**
 * Singleton storage provider factory.
 */
let cachedProvider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
  if (driver === "s3" || driver === "r2") {
    cachedProvider = new S3StorageProvider();
  } else {
    cachedProvider = new LocalDiskStorageProvider();
  }

  return cachedProvider;
}
