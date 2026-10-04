import "server-only";
import { db, type Tx } from "./db";

export interface NotifyInput {
  type: string;
  title: string;
  body: string;
  href?: string;
}

/** Create an in-app notification. Pass `tx` to commit it with the business change. */
export async function notify(userId: string, input: NotifyInput, client: Tx = db) {
  await client.notification.create({
    data: { userId, type: input.type, title: input.title, body: input.body, href: input.href ?? null },
  });
}

export async function notifyAdmins(input: NotifyInput, client: Tx = db) {
  const admins = await client.user.findMany({ where: { roleKey: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  if (admins.length === 0) return;
  await client.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, type: input.type, title: input.title, body: input.body, href: input.href ?? null })),
  });
}
