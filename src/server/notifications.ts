import "server-only";
import { db, type Tx } from "./db";
import { logger } from "./logger";

export interface NotifyInput {
  type: string;
  title: string;
  body: string;
  href?: string;
}

/**
 * Format nomor telepon Indonesia ke format standar 628xxx.
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

/**
 * Kirim pesan WhatsApp melalui Fonnte Gateway.
 * Jika FONNTE_TOKEN belum diisi, aman (log ke console/logger saja).
 */
export async function sendWhatsApp(toPhone: string, message: string): Promise<boolean> {
  const normalized = normalizePhone(toPhone);
  if (!normalized) return false;

  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    logger.info(`[WhatsApp Notification Mock] To: ${normalized} | Msg: "${message}"`);
    return true;
  }

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: normalized,
        message,
        countryCode: "62",
      }),
    });

    if (!res.ok) {
      logger.warn(`WhatsApp gateway responded with status ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.error("Gagal mengirim notifikasi WhatsApp:", { error: String(err) });
    return false;
  }
}

/**
 * Kirim email transaksional melalui Resend.
 * Jika RESEND_API_KEY belum diisi, aman (log ke console/logger saja).
 */
export async function sendEmail(toEmail: string, subject: string, textBody: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info(`[Email Notification Mock] To: ${toEmail} | Subject: "${subject}"`);
    return true;
  }

  try {
    const from = process.env.EMAIL_FROM ?? "PinjeS <notifikasi@pinjes.id>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject,
        text: textBody,
      }),
    });

    if (!res.ok) {
      logger.warn(`Email provider responded with status ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    logger.error("Gagal mengirim notifikasi email:", { error: String(err) });
    return false;
  }
}

/** Create an in-app notification and optionally dispatch WhatsApp / Email. */
export async function notify(
  userId: string,
  input: NotifyInput,
  client: Tx = db,
  options?: { phone?: string | null; email?: string | null },
) {
  await client.notification.create({
    data: { userId, type: input.type, title: input.title, body: input.body, href: input.href ?? null },
  });

  const fullText = input.href
    ? `${input.title}\n\n${input.body}\n\nLihat: ${process.env.APP_URL ?? ""}${input.href}`
    : `${input.title}\n\n${input.body}`;

  if (options?.phone) {
    sendWhatsApp(options.phone, fullText).catch(() => {});
  }
  if (options?.email) {
    sendEmail(options.email, input.title, fullText).catch(() => {});
  }
}

export async function notifyAdmins(input: NotifyInput, client: Tx = db) {
  const admins = await client.user.findMany({ where: { roleKey: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  if (admins.length === 0) return;
  await client.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    })),
  });
}
