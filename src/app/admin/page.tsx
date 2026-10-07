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
    <div className="space-y-2 rounded-2xl bg-canvas p-3 ring-1 ring-line">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={300}
        rows={2}
        placeholder="Alasan penolakan..."
        aria-label="Alasan penolakan"
        className="w-full resize-none rounded-xl border border-line bg-surface p-2.5 text-xs text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none"
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
          className="text-xs font-bold rounded-full"
        >
          {busy ? "Memproses..." : "Kirim penolakan"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={busy} className="text-xs rounded-full">
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
    `rounded-full px-5 py-2 text-sm font-semibold transition duration-200 ${
      active ? "bg-ink text-canvas shadow-xs" : "text-muted hover:bg-ink/5 hover:text-ink"
    }`;

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">Admin PinjeS</h1>
          <p className="mt-1 text-sm text-muted">Tinjau toko baru dan verifikasi top-up saldo deposit.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-full text-xs font-semibold">
            <Link href="/" target="_blank">
              Lihat website utama
            </Link>
          </Button>
          <Button asChild className="rounded-full text-xs font-semibold">
            <Link href="/dashboard/store">Masuk toko saya</Link>
          </Button>
        </div>
      </div>

      <div role="tablist" className="flex gap-2 rounded-full bg-surface p-1.5 ring-1 ring-line w-fit">
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
          Toko menunggu ({stores?.length ?? 0})
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
            <p className="p-12 text-center text-sm text-muted">Memuat pengajuan toko...</p>
          ) : !stores || stores.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-line p-12 text-center text-sm text-muted">
              <p className="font-bold text-ink">Tidak ada toko yang menunggu tinjauan</p>
              <p className="mt-1 text-xs text-muted">Pengajuan toko baru akan muncul di sini.</p>
            </div>
          ) : (
            stores.map((s) => (
              <article key={s.id} className="space-y-4 rounded-[1.75rem] border border-line bg-surface p-6 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink">{s.name}</h2>
                  <p className="text-xs text-muted">
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
                    <dt className="text-muted">Pemilik</dt>
                    <dd className="font-semibold text-ink">
                      {s.owner.name} ({s.owner.email})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">WhatsApp</dt>
                    <dd className="font-mono text-ink">{s.whatsapp || "-"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted">Alamat</dt>
                    <dd className="text-ink">{[s.address, s.city].filter(Boolean).join(", ") || "-"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted">Deskripsi</dt>
                    <dd className="text-ink">{s.description || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Rekening</dt>
                    <dd className="text-ink">
                      {s.bankAccountNumber
                        ? `${s.bankName ?? ""} ${s.bankAccountNumber} a.n. ${s.bankAccountName ?? ""}`
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">QRIS</dt>
                    <dd>
                      {s.qrisImagePath ? (
                        <a
                          href={`/api/files/${s.qrisImagePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-brand hover:underline"
                        >
                          Lihat QRIS
                        </a>
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="border-t border-line pt-4">
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
                      <Button
                        size="sm"
                        variant="signal"
                        disabled={busy}
                        onClick={() => approveStore.mutate(s.id)}
                        className="rounded-full text-ink font-bold"
                      >
                        {approveStore.isPending ? "Menyetujui..." : "Setujui toko"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setRejectingId(s.id)}
                        className="rounded-full"
                      >
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
        <section className="overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-sm">
          <div className="flex flex-col gap-1 border-b border-line bg-canvas/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-base font-bold text-ink">
              Deposit menunggu verifikasi ({deposits?.length ?? 0})
            </h2>
            <span className="text-xs text-muted">
              Saldo ini dipotong biaya layanan setiap toko mengonfirmasi pesanan.
            </span>
          </div>

          {depositsLoading ? (
            <div className="p-12 text-center text-sm text-muted">Memuat permohonan deposit...</div>
          ) : !deposits || deposits.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">
              <p className="font-bold text-ink">Tidak ada deposit yang menunggu</p>
              <p className="mt-1 text-xs text-muted">Permohonan top-up dari toko akan muncul di sini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line bg-canvas/40 text-left text-muted">
                    <th className="p-4 font-semibold">Tanggal</th>
                    <th className="p-4 font-semibold">Toko</th>
                    <th className="p-4 font-semibold">Jumlah</th>
                    <th className="p-4 font-semibold">Pengirim</th>
                    <th className="p-4 font-semibold">Bukti transfer</th>
                    <th className="p-4 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {deposits.map((d) => {
                    const sender =
                      [d.senderName, d.senderBank ? `(${d.senderBank})` : null].filter(Boolean).join(" ") || "-";
                    return (
                      <tr key={d.id} className="align-top hover:bg-canvas/50 transition">
                        <td className="p-4 text-muted">
                          {new Date(d.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-4 font-bold text-ink">{d.store.name}</td>
                        <td className="p-4 font-mono text-sm font-bold text-ink">{formatRupiah(d.amount)}</td>
                        <td className="p-4 text-muted">{sender}</td>
                        <td className="p-4">
                          <a
                            href={`/api/files/${d.proofPath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-brand hover:underline"
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
                                variant="signal"
                                disabled={busy}
                                onClick={() => approveDeposit.mutate(d.id)}
                                className="text-xs font-bold rounded-full text-ink"
                              >
                                {approveDeposit.isPending ? "Menyetujui..." : "Setujui"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => setRejectingId(d.id)}
                                className="text-xs font-bold rounded-full"
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