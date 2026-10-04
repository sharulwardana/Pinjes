import { route } from "@/server/api";
import { readUpload, UPLOAD_KINDS } from "@/server/uploads";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

const notFound = () => new NextResponse("Not Found", { status: 404 });

type Viewer = { id: string; role: string };

// Menentukan apakah user boleh membuka file private ini.
// Kepemilikan file dicari dari path-nya di tabel yang relevan.
async function canViewPrivateFile(
  user: Viewer,
  relativePath: string,
): Promise<boolean> {
  if (user.role === "ADMIN") return true;

  // 1. Bukti transfer pelanggan
  const proof = await db.paymentProof.findUnique({
    where: { filePath: relativePath },
    select: {
      uploadedById: true,
      payment: {
        select: {
          booking: {
            select: {
              customerId: true,
              store: { select: { ownerId: true } },
            },
          },
        },
      },
    },
  });
  if (proof) {
    const booking = proof.payment.booking;
    return (
      proof.uploadedById === user.id ||
      booking.customerId === user.id ||
      booking.store.ownerId === user.id
    );
  }

  // 2. Bukti deposit toko
  const deposit = await db.deposit.findUnique({
    where: { proofPath: relativePath },
    select: { store: { select: { ownerId: true } } },
  });
  if (deposit) return deposit.store.ownerId === user.id;

  // 3. Dokumen toko (KTP/izin usaha/foto toko)
  const doc = await db.storeDocument.findFirst({
    where: { filePath: relativePath },
    select: { store: { select: { ownerId: true } } },
  });
  if (doc) return doc.store.ownerId === user.id;

  // 4. QRIS toko: pemilik toko + pelanggan yang punya pesanan di toko itu
  const store = await db.store.findFirst({
    where: { qrisImagePath: relativePath },
    select: { id: true, ownerId: true },
  });
  if (store) {
    if (store.ownerId === user.id) return true;
    const hasBooking = await db.booking.findFirst({
      where: { storeId: store.id, customerId: user.id },
      select: { id: true },
    });
    return Boolean(hasBooking);
  }

  // File private yang tidak tercatat di mana pun: tolak.
  return false;
}

export const GET = route({}, async ({ params, user }) => {
  const p = await params;
  const rawPath = p.path;
  const relativePath = Array.isArray(rawPath) ? rawPath.join("/") : rawPath;

  if (!relativePath) return notFound();

  const file = await readUpload(relativePath);
  if (!file) return notFound();

  const isPublic = UPLOAD_KINDS[file.kind].public;

  if (!isPublic) {
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    const allowed = await canViewPrivateFile(
      { id: user.id, role: user.role },
      relativePath,
    );
    // 404 (bukan 403) supaya orang tidak bisa menebak file mana yang ada.
    if (!allowed) return notFound();
  }

  return new NextResponse(file.buf, {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": isPublic
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Last-Modified": file.mtime.toUTCString(),
    },
  });
});