"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useApproveDeposit,
  useApproveStore,
  usePendingDeposits,
  usePendingStores,
  useRejectDeposit,
  useRejectStore,
} from "@/features/admin/hooks";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/button";

/** Kotak alasan penolakan yang dipakai di kedua tab. */
function RejectBox({
  busy,
  onSubmit,
  onCancel,
}: {
  busy: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="space-y-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder="Alasan penolakan"
        aria-label="Alasan penolakan"
        className="w-full rounded-md border border-zinc-300 p-2 text-xs"
      />
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={() => {
            if (reason.trim().length < 3) {
              setError("Tulis alasan penolakan.");
              return;
            }
            onSubmit(reason.trim());
          }}
          className="text-xs font-bold"
        >
          {busy ? "Memproses..." : "Kirim penolakan"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={busy} className="text-xs">
          Batal
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<"stores" | "deposits">("stores");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data: deposits, isLoading: depositsLoading } = usePendingDeposits();
  const approveDeposit = useApproveDeposit();
  const rejectDeposit = useRejectDeposit();

  const { data: stores, isLoading: storesLoading } = usePendingStores();
  const approveStore = useApproveStore();
  const rejectStore = useRejectStore();

  const busy =
    approveDeposit.isPending || rejectDeposit.isPending || approveStore.isPending || rejectStore.isPending;

  const tabClass = (active: boolean) =>
    `border-b-2 px-4 pb-3 text-sm font-semibold transition-colors ${active ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
    }`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Admin PinjeS</h1>
          <p className="mt-1 text-sm text-zinc-500">Tinjau toko baru dan verifikasi top-up deposit.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-xl text-xs font-semibold">
            <Link href="/" target="_blank">
              Lihat website utama
            </Link>
          </Button>
          <Button asChild className="rounded-xl text-xs font-semibold">
            <Link href="/dashboard/store">Masuk toko saya</Link>
          </Button>
        </div>
      </div>

      <div role="tablist" className="flex gap-2 border-b border-zinc-200">
        <button
          role="tab"
          type="button"
          aria-selected={tab === "stores"}
          onClick={() => {
            setTab("stores");
            setRejectingId(null);
          }}
          className={tabClass(tab === "stores")}
        >
          Toko menunggu tinjauan ({stores?.length ?? 0})
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "deposits"}
          onClick={() => {
            setTab("deposits");
            setRejectingId(null);
          }}
          className={tabClass(tab === "deposits")}
        >
          Deposit menunggu ({deposits?.length ?? 0})
        </button>
      </div>

      {tab === "stores" && (
        <section className="space-y-4">
          {storesLoading ? (
            <p className="p-8 text-center text-sm text-zinc-400">Memuat pengajuan toko...</p>
          ) : !stores || stores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-500">
              <p className="font-bold text-zinc-800">Tidak ada toko yang menunggu</p>
              <p className="mt-1 text-xs text-zinc-400">Pengajuan toko baru akan muncul di sini.</p>
            </div>
          ) : (
            stores.map((s) => (
              <article key={s.id} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="text-lg font-bold text-zinc-900">{s.name}</h2>
                  <p className="text-xs text-zinc-500">
                    Diajukan{" "}
                    {s.submittedAt
                      ? new Date(s.submittedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "-"}
                  </p>
                </div>

                <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-zinc-500">Pemilik</dt>
                    <dd className="text-zinc-900">
                      {s.owner.name} ({s.owner.email})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">WhatsApp</dt>
                    <dd className="font-mono text-zinc-900">{s.whatsapp || "-"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-zinc-500">Alamat</dt>
                    <dd className="text-zinc-900">{[s.address, s.city].filter(Boolean).join(", ") || "-"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-zinc-500">Deskripsi</dt>
                    <dd className="text-zinc-900">{s.description || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Rekening</dt>
                    <dd className="text-zinc-900">
                      {s.bankAccountNumber
                        ? `${s.bankName ?? ""} ${s.bankAccountNumber} a.n. ${s.bankAccountName ?? ""}`
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">QRIS</dt>
                    <dd>
                      {s.qrisImagePath ? (
                        <a
                          href={`/api/files/${s.qrisImagePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          Lihat QRIS
                        </a>
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-zinc-100 pt-4">
                  {rejectingId === s.id ? (
                    <RejectBox
                      busy={rejectStore.isPending}
                      onCancel={() => setRejectingId(null)}
                      onSubmit={(reason) =>
                        rejectStore.mutate({ storeId: s.id, reason }, { onSuccess: () => setRejectingId(null) })
                      }
                    />
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busy} onClick={() => approveStore.mutate(s.id)}>
                        {approveStore.isPending ? "Menyetujui..." : "Setujui toko"}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejectingId(s.id)}>
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {tab === "deposits" && (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-zinc-100 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold text-zinc-900">Deposit menunggu verifikasi ({deposits?.length ?? 0})</h2>
            <span className="text-xs text-zinc-500">
              Saldo ini dipotong biaya layanan setiap toko mengonfirmasi pembayaran pesanan.
            </span>
          </div>

          {depositsLoading ? (
            <div className="p-8 text-center text-sm text-zinc-400">Memuat permohonan deposit...</div>
          ) : !deposits || deposits.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-500">
              <p className="font-bold text-zinc-800">Tidak ada deposit yang menunggu</p>
              <p className="mt-1 text-xs text-zinc-400">Permohonan top-up dari toko akan muncul di sini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50 text-left text-zinc-500">
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
                    const sender =
                      [d.senderName, d.senderBank ? `(${d.senderBank})` : null].filter(Boolean).join(" ") || "-";
                    return (
                      <tr key={d.id} className="align-top hover:bg-zinc-50">
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
                        <td className="p-4 font-mono text-sm font-bold text-zinc-900">{formatRupiah(d.amount)}</td>
                        <td className="p-4 text-zinc-600">{sender}</td>
                        <td className="p-4">
                          <a
                            href={`/api/files/${d.proofPath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            Lihat bukti
                          </a>
                        </td>
                        <td className="min-w-60 p-4">
                          {rejectingId === d.id ? (
                            <RejectBox
                              busy={rejectDeposit.isPending}
                              onCancel={() => setRejectingId(null)}
                              onSubmit={(reason) =>
                                rejectDeposit.mutate(
                                  { depositId: d.id, reason },
                                  { onSuccess: () => setRejectingId(null) },
                                )
                              }
                            />
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={busy}
                                onClick={() => approveDeposit.mutate(d.id)}
                                className="text-xs font-bold"
                              >
                                {approveDeposit.isPending ? "Menyetujui..." : "Setujui"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => setRejectingId(d.id)}
                                className="text-xs font-bold"
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
        </section>
      )}
    </div>
  );
}