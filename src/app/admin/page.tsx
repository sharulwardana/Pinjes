"use client";

import { useState } from "react";
import Link from "next/link";
import { usePendingDeposits, useApproveDeposit, useRejectDeposit } from "@/features/admin/hooks";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { data: deposits, isLoading } = usePendingDeposits();
  const approveMut = useApproveDeposit();
  const rejectMut = useRejectDeposit();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const busy = approveMut.isPending || rejectMut.isPending;

  function startReject(id: string) {
    setRejectingId(id);
    setReason("");
    setReasonError("");
  }

  function cancelReject() {
    setRejectingId(null);
    setReason("");
    setReasonError("");
  }

  function submitReject(depositId: string) {
    if (reason.trim().length < 3) {
      setReasonError("Tulis alasan penolakan.");
      return;
    }
    rejectMut.mutate(
      { depositId, reason: reason.trim() },
      { onSuccess: cancelReject },
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Admin PinjeS</h1>
          <p className="text-zinc-500 text-sm mt-1">Verifikasi top-up deposit saldo toko.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-xl text-xs font-semibold">
            <Link href="/" target="_blank">Lihat website utama</Link>
          </Button>
          <Button asChild className="rounded-xl text-xs font-semibold">
            <Link href="/dashboard/store">Masuk toko saya</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 bg-zinc-50 p-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-sm text-zinc-900">
            Deposit menunggu verifikasi ({deposits?.length ?? 0})
          </h2>
          <span className="text-xs text-zinc-500">
            Saldo ini dipotong biaya layanan setiap toko mengonfirmasi pembayaran pesanan.
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Memuat permohonan deposit...</div>
        ) : !deposits || deposits.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            <p className="font-bold text-zinc-800">Tidak ada deposit yang menunggu</p>
            <p className="text-xs text-zinc-400 mt-1">
              Permohonan top-up dari toko akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-zinc-500 bg-zinc-50/50">
                  <th className="p-4 font-semibold">Tanggal</th>
                  <th className="p-4 font-semibold">Toko</th>
                  <th className="p-4 font-semibold">Jumlah</th>
                  <th className="p-4 font-semibold">Pengirim</th>
                  <th className="p-4 font-semibold">Bukti transfer</th>
                  <th className="p-4 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {deposits.map((d) => {
                  const rejecting = rejectingId === d.id;
                  const sender =
                    [d.senderName, d.senderBank ? `(${d.senderBank})` : null]
                      .filter(Boolean)
                      .join(" ") || "-";
                  return (
                    <tr key={d.id} className="align-top hover:bg-zinc-50 transition-colors">
                      <td className="p-4 text-zinc-600">
                        {new Date(d.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4 font-bold text-zinc-900">{d.store.name}</td>
                      <td className="p-4 font-bold text-zinc-900 font-mono text-sm">
                        {formatRupiah(d.amount)}
                      </td>
                      <td className="p-4 text-zinc-600">{sender}</td>
                      <td className="p-4">
                        <a
                          href={`/api/files/${d.proofPath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Lihat bukti
                        </a>
                      </td>
                      <td className="p-4 min-w-[240px]">
                        {rejecting ? (
                          <div className="space-y-2">
                            <textarea
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              maxLength={300}
                              rows={2}
                              placeholder="Alasan penolakan"
                              className="w-full rounded-md border border-zinc-300 p-2 text-xs"
                            />
                            {reasonError && <p className="text-red-600">{reasonError}</p>}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => submitReject(d.id)}
                                disabled={busy}
                                className="text-xs font-bold"
                              >
                                {rejectMut.isPending ? "Memproses..." : "Kirim penolakan"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelReject}
                                disabled={busy}
                                className="text-xs"
                              >
                                Batal
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveMut.mutate(d.id)}
                              disabled={busy}
                              className="rounded-lg text-xs font-bold"
                            >
                              {approveMut.isPending ? "Menyetujui..." : "Setujui"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startReject(d.id)}
                              disabled={busy}
                              className="rounded-lg text-xs font-bold"
                            >
                              Tolak
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}