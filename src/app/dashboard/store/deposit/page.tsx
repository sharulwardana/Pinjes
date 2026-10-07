import { Metadata } from "next";
import { DepositForm } from "./deposit-form";
import { getCurrentUser } from "@/server/session";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { getSettings } from "@/server/settings";
import { formatRupiah } from "@/lib/format";

export const metadata: Metadata = {
  title: "Deposit Toko | PinjeS",
};

export default async function StoreDepositPage() {
  const user = await getCurrentUser();
  if (user?.role !== "STORE_OWNER" || !user.storeId) redirect("/login");

  const [store, deposits, settings] = await Promise.all([
    db.store.findUnique({
      where: { id: user.storeId },
      select: { depositBalance: true },
    }),
    db.deposit.findMany({
      where: { storeId: user.storeId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    getSettings(),
  ]);

  if (!store) redirect("/login");

  const platformAccount =
    settings.admin_bank_name && settings.admin_bank_account && settings.admin_bank_account_name
      ? {
        bankName: settings.admin_bank_name,
        accountNumber: settings.admin_bank_account,
        accountName: settings.admin_bank_account_name,
      }
      : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">Dompet Deposit</h1>
        <p className="mt-1 text-sm text-muted">Kelola saldo deposit untuk membayar biaya layanan PinjeS.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-muted">Saldo Deposit Saat Ini</h2>
            <p className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
              {formatRupiah(store.depositBalance)}
            </p>
          </div>
          <div className="mt-6 space-y-2 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            <p>
              Setiap kali kamu mengonfirmasi pembayaran penyewa, biaya layanan {formatRupiah(settings.service_fee)}{" "}
              dipotong dari saldo ini. Saldo ini bukan pendapatan sewa dan tidak bisa ditarik.
            </p>
            <p className="font-semibold text-ink">
              Minimal top-up saldo: {formatRupiah(settings.minimum_deposit)}.
            </p>
          </div>
        </div>

        <DepositForm platformAccount={platformAccount} />
      </div>

      <div className="rounded-[1.75rem] border border-line bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-line bg-canvas/60 p-5">
          <h3 className="font-display text-base font-bold text-ink">Riwayat Top-up</h3>
        </div>
        <div>
          {deposits.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">Belum ada riwayat top-up.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/40 text-left text-xs font-semibold text-muted">
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Jumlah</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Bank Pengirim</th>
                    <th className="p-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-canvas/40 transition">
                      <td className="p-4 text-muted">
                        {d.createdAt.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 font-mono font-bold text-ink text-sm">{formatRupiah(d.amount)}</td>
                      <td className="p-4">
                        {d.status === "PENDING" && (
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                            Menunggu Verifikasi
                          </span>
                        )}
                        {d.status === "APPROVED" && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800 ring-1 ring-inset ring-green-600/20">
                            Berhasil
                          </span>
                        )}
                        {d.status === "REJECTED" && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-600/20">
                            Ditolak
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted">{d.senderBank || "-"}</td>
                      <td className="p-4 text-muted">
                        {d.status === "REJECTED" ? d.rejectionReason || "-" : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}