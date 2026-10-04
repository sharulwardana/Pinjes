import { route, readForm, ok } from "@/server/api";
import { AppError, ForbiddenError } from "@/server/errors";
import { RATE_LIMITS } from "@/server/rate-limit";
import { saveUpload, UPLOAD_KINDS, type UploadKind } from "@/server/uploads";
import type { RoleKey } from "@prisma/client";

// Siapa boleh mengunggah jenis file apa. Admin boleh semuanya.
const KIND_ROLES: Record<UploadKind, RoleKey[]> = {
  product: ["STORE_OWNER"],
  "store-logo": ["STORE_OWNER"],
  "store-cover": ["STORE_OWNER"],
  qris: ["STORE_OWNER"],
  "store-doc": ["STORE_OWNER"],
  "deposit-proof": ["STORE_OWNER"],
  "payment-proof": ["CUSTOMER", "STORE_OWNER"],
  review: ["CUSTOMER", "STORE_OWNER"],
};

export const POST = route(
  { auth: true, rateLimit: { ...RATE_LIMITS.upload, key: "upload" } },
  async ({ req, user }) => {
    const formData = await readForm(req);

    const kindStr = formData.get("kind");
    if (typeof kindStr !== "string" || !(kindStr in UPLOAD_KINDS)) {
      throw new AppError("Jenis file (kind) tidak valid.", 400);
    }
    const kind = kindStr as UploadKind;

    if (user.role !== "ADMIN" && !KIND_ROLES[kind].includes(user.role)) {
      throw new ForbiddenError("Kamu tidak boleh mengunggah jenis file ini.");
    }

    const file = formData.get("file");
    if (!file) {
      throw new AppError("File tidak ditemukan dalam form-data.", 400);
    }

    const stored = await saveUpload(file, kind);

    return ok({
      path: stored.path,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      sha256: stored.sha256,
    });
  },
);