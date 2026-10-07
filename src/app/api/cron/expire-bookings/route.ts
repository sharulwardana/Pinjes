import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { expireOverdueBookings } from "@/server/services/bookings";

/**
 * Dipanggil penjadwal (cron host, Vercel Cron, dsb) tiap beberapa menit:
 *   Authorization: Bearer $CRON_SECRET
 * Tanpa CRON_SECRET di env, route ini menolak semua permintaan.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  const a = Buffer.from(given);
  const b = Buffer.from(secret ?? "");
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const expired = await expireOverdueBookings();
  return NextResponse.json({ expired });
}
