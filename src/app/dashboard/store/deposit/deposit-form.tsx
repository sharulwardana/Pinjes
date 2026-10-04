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
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900 mb-4">Request Top-up</h2>

      {platformAccount ? (
        <p className="text-sm text-zinc-500 mb-6">
          Silakan transfer ke rekening{" "}
          <strong>
            {platformAccount.bankName} {platformAccount.accountNumber} a.n. {platformAccount.accountName}
          </strong>
          , lalu unggah buktinya di sini.
        </p>
      ) : (
        <div className="mb-6 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
          Rekening tujuan top-up belum diatur. Hubungi admin PinjeS sebelum melakukan transfer.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Jumlah Transfer (Rp)</label>
          <input
            type="number"
            {...register("amount")}
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            placeholder="50000"
          />
          {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Bank Asal</label>
            <input
              {...register("senderBank")}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="BCA"
            />
            {errors.senderBank && <p className="mt-1 text-xs text-red-600">{errors.senderBank.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Nama Pengirim</label>
            <input
              {...register("senderName")}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="Budi Santoso"
            />
            {errors.senderName && <p className="mt-1 text-xs text-red-600">{errors.senderName.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Tanggal Transfer</label>
          <input
            type="date"
            max={today}
            {...register("transferDate")}
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          {errors.transferDate && <p className="mt-1 text-xs text-red-600">{errors.transferDate.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Bukti Transfer</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              id="proof-upload"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="proof-upload"
              className="cursor-pointer rounded-xl border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {uploading ? "Mengunggah..." : proofFileId ? "Ganti File" : "Pilih File Bukti"}
            </label>
            {proofFileId && <span className="text-xs text-green-600 font-medium">Bukti terlampir</span>}
          </div>
          {errors.proofFileId && <p className="mt-1 text-xs text-red-600">{errors.proofFileId.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!platformAccount || isSubmitting || topupMut.isPending || uploading || !proofFileId}
        >
          {isSubmitting || topupMut.isPending ? "Memproses..." : "Kirim Permintaan Top-up"}
        </Button>
      </form>
    </div>
  );
}