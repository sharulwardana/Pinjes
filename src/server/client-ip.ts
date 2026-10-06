import { isIP } from "node:net";

/**
 * Mengambil IP klien dari header proxy.
 *
 * `X-Forwarded-For` bisa diisi sendiri oleh klien, jadi entri paling kiri TIDAK boleh
 * dipercaya. Setiap proxy tepercaya menambahkan alamat peer-nya di kanan, maka IP klien
 * asli adalah entri ke-`hops` dari kanan. `hops` = jumlah proxy tepercaya di depan app
 * (0 = tidak ada proxy; header diabaikan sama sekali).
 */
export function clientIpFromHeaders(
  forwardedFor: string | null | undefined,
  realIp: string | null | undefined,
  hops: number,
): string | null {
  if (!Number.isInteger(hops) || hops < 1) return null;

  const chain = (forwardedFor ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const candidate = chain.length >= hops ? chain[chain.length - hops] : chain.length === 0 ? realIp?.trim() : null;
  return candidate && isIP(candidate) ? candidate : null;
}
