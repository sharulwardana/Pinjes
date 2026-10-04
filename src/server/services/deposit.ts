import "server-only";
import { createHash } from "node:crypto";
import { db } from "../db";
import { CreateDepositInput } from "@/features/deposit/schemas";
import { AppError } from "../errors";
import { SessionUser } from "./auth";
import { readUpload } from "../uploads";
import { getSettings } from "../settings";

const PROOF_FOLDER = "deposit-proof";

export async function createDepositRequest(user: SessionUser, input: CreateDepositInput) {
  if (user.role !== "STORE_OWNER" || !user.storeId) {
    throw new AppError("Akses ditolak.", 403);
  }

  const settings = (await getSettings()) as unknown as Record<string, unknown>;
  const minimum = Number(settings.minimum_deposit);
  if (Number.isFinite(minimum) && minimum > 0 && input.amount < minimum) {
    throw new AppError(
      `Minimal top-up Rp ${minimum.toLocaleString("id-ID")}.`,
      400,
    );
  }

  const relativePath = input.proofFileId.replace(/\\/g, "/");
  if (
    relativePath.includes("..") ||
    relativePath.startsWith("/") ||
    !relativePath.startsWith(`${PROOF_FOLDER}/`)
  ) {
    throw new AppError("File bukti transfer tidak valid.", 400);
  }

  const file = await readUpload(relativePath);
  if (!file) {
    throw new AppError("File bukti transfer tidak ditemukan di server.", 400);
  }

  const sha256 = createHash("sha256").update(file.buf).digest("hex");

  const duplicate = await db.deposit.findFirst({
    where: { OR: [{ proofSha256: sha256 }, { proofPath: relativePath }] },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError("Bukti transfer ini sudah pernah diajukan.", 409);
  }

  return await db.deposit.create({
    data: {
      storeId: user.storeId,
      amount: input.amount,
      senderBank: input.senderBank,
      senderName: input.senderName,
      transferDate: new Date(`${input.transferDate}T00:00:00.000Z`),
      proofPath: relativePath,
      proofMime: file.mimeType,
      proofSha256: sha256,
      status: "PENDING",
    },
  });
}

export async function getStoreDeposits(storeId: string) {
  return await db.deposit.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
}