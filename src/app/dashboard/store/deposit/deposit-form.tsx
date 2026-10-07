"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createDepositSchema, CreateDepositInput } from "@/features/deposit/schemas";
import { useTopupDeposit } from "@/features/deposit/hooks";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UploadResult { path: string; }

export interface PlatformAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export function DepositForm({ platformAccount = null }: { platformAccount?: PlatformAccount | null }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const topupMut = useTopupDeposit();
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createDepositSchema),
    defaultValues: {
      amount: 50000,
      transferDate: today,
    },
  });

  const proofFileId = useWatch({ control, name: "proofFileId" });

  const onSubmit = (data: any) => {
    if (data.transferDate > today) {
      setError("transferDate", { message: "Tanggal transfer tidak boleh di masa depan." });
      return;
    }
    topupMut.mutate(data as CreateDepositInput, {
      onSuccess: () => {
        router.refresh();
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "deposit-proof");

    try {
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      const uploadData = json.data as UploadResult;
      setValue("proofFileId", uploadData.path, { shouldValidate: true });
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold tracking-tight text-ink mb-2">Permintaan Top-up</h2>

      {platformAccount ? (
        <p className="text-sm leading-relaxed text-muted mb-6">
          Silakan transfer ke rekening{" "}
          <strong className="text-ink">
            {platformAccount.bankName} {platformAccount.accountNumber} a.n. {platformAccount.accountName}
          </strong>
          , lalu unggah buktinya di bawah.
        </p>
      ) : (
        <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Rekening tujuan top-up belum diatur. Hubungi admin PinjeS sebelum melakukan transfer.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Jumlah Transfer (Rp)</label>
          <input
            type="number"
            {...register("amount")}
            className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-signal/50"
            placeholder="50000"
          />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">Bank Asal</label>
            <input
              {...register("senderBank")}
              className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-signal/50"
              placeholder="Contoh: BCA"
            />
            {errors.senderBank && <p className="mt-1 text-xs text-red-600">{errors.senderBank.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">Nama Pengirim</label>
            <input
              {...register("senderName")}
              className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-signal/50"
              placeholder="Sesuai rekening"
            />
            {errors.senderName && <p className="mt-1 text-xs text-red-600">{errors.senderName.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Tanggal Transfer</label>
          <input
            type="date"
            max={today}
            {...register("transferDate")}
            className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-signal/50"
          />
          {errors.transferDate && <p className="mt-1 text-xs text-red-600">{errors.transferDate.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">Bukti Transfer</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              id="proof-upload"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="proof-upload"
              className="cursor-pointer rounded-full border border-line bg-canvas px-5 py-2.5 text-xs font-semibold text-ink transition hover:border-ink hover:bg-surface active:scale-95"
            >
              {uploading ? "Mengunggah..." : proofFileId ? "Ganti File" : "Pilih File Bukti"}
            </label>
            {proofFileId && <span className="text-xs font-semibold text-brand">✓ Bukti terlampir</span>}
          </div>
          {errors.proofFileId && <p className="mt-1 text-xs text-red-600">{errors.proofFileId.message}</p>}
        </div>

        <Button
          type="submit"
          variant="signal"
          size="lg"
          className="w-full rounded-full font-semibold text-ink"
          disabled={!platformAccount || isSubmitting || topupMut.isPending || uploading || !proofFileId}
        >
          {isSubmitting || topupMut.isPending ? "Memproses..." : "Kirim Permintaan Top-up"}
        </Button>
      </form>
    </div>
  );
}