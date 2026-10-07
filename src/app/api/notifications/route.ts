import { route, ok } from "@/server/api";
import { db } from "@/server/db";

export const GET = route({ auth: true }, async ({ user }) => {
  const [items, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.notification.count({
      where: { userId: user!.id, readAt: null },
    }),
  ]);

  return ok({ items, unreadCount });
});

export const POST = route({ auth: true }, async ({ user }) => {
  await db.notification.updateMany({
    where: { userId: user!.id, readAt: null },
    data: { readAt: new Date() },
  });

  return ok({}, "Semua notifikasi ditandai telah dibaca.");
});
