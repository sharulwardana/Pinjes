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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dompet Deposit</h1>
        <p className="text-zinc-500">Kelola saldo deposit untuk membayar biaya layanan PinjeS.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-500">Saldo Deposit Saat Ini</h2>
          <p className="mt-2 text-4xl font-bold text-zinc-900">{formatRupiah(store.depositBalance)}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Setiap kali kamu mengonfirmasi pembayaran penyewa, biaya layanan {formatRupiah(settings.service_fee)}{" "}
            dipotong dari saldo ini. Saldo ini bukan pendapatan sewa dan tidak bisa ditarik.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Minimal top-up {formatRupiah(settings.minimum_deposit)}.
          </p>
        </div>

        <DepositForm platformAccount={platformAccount} />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 bg-zinc-50/50 p-4">
          <h3 className="font-semibold text-zinc-900">Riwayat Top-up</h3>
        </div>
        <div className="p-0">
          {deposits.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">Belum ada riwayat top-up.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-zinc-500">
                    <th className="p-4 font-medium">Tanggal</th>
                    <th className="p-4 font-medium">Jumlah</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Bank Pengirim</th>
                    <th className="p-4 font-medium">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {deposits.map((d) => (
                    <tr key={d.id} className="group hover:bg-zinc-50">
                      <td className="p-4 text-zinc-600">
                        {d.createdAt.toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4 font-medium text-zinc-900">{formatRupiah(d.amount)}</td>
                      <td className="p-4">
                        {d.status === "PENDING" && (
                          <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                            Menunggu Verifikasi
                          </span>
                        )}
                        {d.status === "APPROVED" && (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Berhasil
                          </span>
                        )}
                        {d.status === "REJECTED" && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                            Ditolak
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-600">{d.senderBank || "-"}</td>
                      <td className="p-4 text-zinc-600">
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