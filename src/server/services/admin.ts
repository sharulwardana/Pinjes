import "server-only";
import { db } from "../db";
import { AppError } from "../errors";

export async function getPendingDeposits() {
  return await db.deposit.findMany({
    where: { status: "PENDING" },
    include: {
      store: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function approveDeposit(adminId: string, depositId: string) {
  return await db.$transaction(async (tx) => {
    const deposit = await tx.deposit.findUnique({ where: { id: depositId } });

    if (!deposit) throw new AppError("Deposit tidak ditemukan.", 404);

    // Kunci: hanya satu permintaan yang berhasil mengubah PENDING menjadi APPROVED.
    const claimed = await tx.deposit.updateMany({
      where: { id: deposit.id, status: "PENDING" },
      data: { status: "APPROVED", reviewedById: adminId, reviewedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new AppError("Deposit ini sudah diproses.", 409);
    }

    const store = await tx.store.update({
      where: { id: deposit.storeId },
      data: { depositBalance: { increment: deposit.amount }, lockVersion: { increment: 1 } },
      select: { depositBalance: true },
    });

    await tx.depositTransaction.create({
      data: {
        storeId: deposit.storeId,
        type: "TOP_UP",
        amount: deposit.amount,
        balanceBefore: store.depositBalance - deposit.amount,
        balanceAfter: store.depositBalance,
        referenceType: "DEPOSIT",
        referenceId: deposit.id,
        description: `Top-up sebesar Rp ${deposit.amount.toLocaleString("id-ID")} via ${deposit.senderBank || "transfer"}`,
        createdById: adminId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "APPROVE_DEPOSIT",
        entityType: "Deposit",
        entityId: deposit.id,
        metadata: JSON.stringify({ amount: deposit.amount, storeId: deposit.storeId }),
      },
    });

    return true;
  });
}

export async function rejectDeposit(adminId: string, depositId: string, reason: string) {
  const cleanReason = reason.trim();
  if (cleanReason.length < 3) {
    throw new AppError("Tulis alasan penolakan.", 400);
  }

  return await db.$transaction(async (tx) => {
    const deposit = await tx.deposit.findUnique({
      where: { id: depositId },
      include: { store: { select: { ownerId: true } } },
    });
    if (!deposit) throw new AppError("Deposit tidak ditemukan.", 404);

    const claimed = await tx.deposit.updateMany({
      where: { id: deposit.id, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: cleanReason,
      },
    });
    if (claimed.count === 0) {
      throw new AppError("Deposit ini sudah diproses.", 409);
    }

    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "REJECT_DEPOSIT",
        entityType: "Deposit",
        entityId: deposit.id,
        metadata: JSON.stringify({ reason: cleanReason, storeId: deposit.storeId }),
      },
    });

    await tx.notification.create({
      data: {
        userId: deposit.store.ownerId,
        type: "DEPOSIT_REJECTED",
        title: "Top-up deposit ditolak",
        body: `Alasan: ${cleanReason}`,
        href: "/dashboard/store",
      },
    });

    return true;
  });
}