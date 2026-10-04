import Link from "next/link";
import { getSettings } from "@/server/settings";

// 0812..., 812..., 62812... -> 62812...
function whatsappHref(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return null;
    const normalized = digits.startsWith("62") ? digits : digits.startsWith("0") ? `62${digits.slice(1)}` : `62${digits}`;
    return `https://wa.me/${normalized}`;
}

const linkClass = "text-canvas/70 transition-colors hover:text-signal";

export async function Footer() {
    const settings = await getSettings();
    const support = settings.support_whatsapp ? whatsappHref(settings.support_whatsapp) : null;

    return (
        <footer className="mt-24 overflow-hidden bg-ink text-canvas">
            <div className="shell grid gap-12 pb-10 pt-16 md:grid-cols-[1.4fr_1fr_1fr] md:pt-20">
                <div className="max-w-sm">
                    <p className="font-display text-3xl font-bold tracking-tight">{settings.platform_name}</p>
                    <p className="mt-4 text-sm leading-relaxed text-canvas/70">
                        Pinjam Sebentar. Temukan barang sewaan dari toko rental lokal, bayar langsung ke toko, lalu ambil sesuai
                        tanggal sewa.
                    </p>
                </div>

                <nav aria-label="Tautan penyewa" className="text-sm">
                    <p className="text-eyebrow text-signal">Penyewa</p>
                    <ul className="mt-5 space-y-3">
                        <li>
                            <Link href="/search" className={linkClass}>
                                Cari barang
                            </Link>
                        </li>
                        <li>
                            <Link href="/orders" className={linkClass}>
                                Pesanan saya
                            </Link>
                        </li>
                    </ul>
                </nav>

                <nav aria-label="Tautan pemilik toko" className="text-sm">
                    <p className="text-eyebrow text-signal">Pemilik toko</p>
                    <ul className="mt-5 space-y-3">
                        <li>
                            <Link href="/register" className={linkClass}>
                                Daftarkan toko
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/store" className={linkClass}>
                                Dashboard toko
                            </Link>
                        </li>
                        {support && (
                            <li>
                                <a href={support} target="_blank" rel="noopener noreferrer" className={linkClass}>
                                    Hubungi kami
                                </a>
                            </li>
                        )}
                    </ul>
                </nav>
            </div>

            {/* Wordmark raksasa sebagai penutup */}
            <p
                aria-hidden
                className="select-none whitespace-nowrap text-center font-display font-bold leading-[0.8] tracking-tighter text-canvas/[0.06]"
                style={{ fontSize: "clamp(5rem, 24vw, 26rem)" }}
            >
                pinjes
            </p>

            <div className="border-t border-white/10">
                <p className="shell py-5 text-xs text-canvas/50">
                    &copy; {new Date().getFullYear()} {settings.platform_name}. Pembayaran dilakukan langsung antara penyewa dan
                    toko.
                </p>
            </div>
        </footer>
    );
}
