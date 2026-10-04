import Link from "next/link";
import { getSettings } from "@/server/settings";

// 0812..., 812..., 62812... -> 62812...
function whatsappHref(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return null;
    const normalized = digits.startsWith("62") ? digits : digits.startsWith("0") ? `62${digits.slice(1)}` : `62${digits}`;
    return `https://wa.me/${normalized}`;
}

export async function Footer() {
    const settings = await getSettings();
    const support = settings.support_whatsapp ? whatsappHref(settings.support_whatsapp) : null;

    return (
        <footer className="mt-auto border-t border-slate-200 bg-white">
            <div className="container mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:flex-row md:justify-between">
                <div className="max-w-sm">
                    <p className="text-lg font-bold tracking-tight text-slate-900">{settings.platform_name}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        Pinjam Sebentar. Temukan barang sewaan dari toko rental lokal, bayar langsung ke toko, lalu ambil sesuai
                        tanggal sewa.
                    </p>
                </div>

                <nav aria-label="Tautan footer" className="grid grid-cols-2 gap-8 text-sm">
                    <div className="space-y-2">
                        <p className="font-semibold text-slate-900">Penyewa</p>
                        <ul className="space-y-2 text-slate-600">
                            <li>
                                <Link href="/search" className="hover:text-slate-900">
                                    Cari barang
                                </Link>
                            </li>
                            <li>
                                <Link href="/orders" className="hover:text-slate-900">
                                    Pesanan saya
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <p className="font-semibold text-slate-900">Pemilik toko</p>
                        <ul className="space-y-2 text-slate-600">
                            <li>
                                <Link href="/register" className="hover:text-slate-900">
                                    Daftarkan toko
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard/store" className="hover:text-slate-900">
                                    Dashboard toko
                                </Link>
                            </li>
                            {support && (
                                <li>
                                    <a href={support} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">
                                        Hubungi kami
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>
                </nav>
            </div>

            <div className="border-t border-slate-100">
                <p className="container mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} {settings.platform_name}. Pembayaran dilakukan langsung antara penyewa dan
                    toko.
                </p>
            </div>
        </footer>
    );
}