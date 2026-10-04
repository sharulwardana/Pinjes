import "server-only";
import { z } from "zod";
import { db, type Tx } from "./db";

export const settingsSchema = z.object({
  platform_name: z.string().trim().min(2).max(60),
  service_fee: z.coerce.number().int().min(0).max(1_000_000),
  minimum_deposit: z.coerce.number().int().min(10_000).max(100_000_000),
  low_balance_threshold: z.coerce.number().int().min(0).max(10_000_000),
  payment_window_hours: z.coerce.number().int().min(1).max(72),
  admin_bank_name: z.string().trim().max(60),
  admin_bank_account: z.string().trim().max(40),
  admin_bank_account_name: z.string().trim().max(80),
  support_whatsapp: z.string().trim().max(20),
  maintenance_mode: z.preprocess((v) => v === true || v === "true", z.boolean()),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  platform_name: "PinjeS",
  service_fee: 5000,
  minimum_deposit: 50000,
  low_balance_threshold: 10000,
  payment_window_hours: 3,
  admin_bank_name: "",
  admin_bank_account: "",
  admin_bank_account_name: "",
  support_whatsapp: "",
  maintenance_mode: false,
};

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

export async function getSettings(client: Tx = db): Promise<Settings> {
  const rows = await client.adminSetting.findMany();
  const raw: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in DEFAULT_SETTINGS) raw[row.key] = row.value;
  }
  const parsed = settingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export function serializeSetting(value: Settings[keyof Settings]): string {
  return typeof value === "boolean" ? String(value) : String(value);
}
