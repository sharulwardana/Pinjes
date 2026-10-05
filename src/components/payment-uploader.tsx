"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useUploadPayment } from "@/features/booking/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function PaymentUploader({ bookingId }: { bookingId: string }) {
  const upload = useUploadPayment();
  const [file, setFile] = useState<File | null>(null);
  const [senderName, setSenderName] = useState("");

  // Pratinjau gambar yang dipilih; URL-nya dibersihkan saat berganti atau komponen ditutup.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleUpload = () => {
    if (!file || !senderName) return;
    upload.mutate({ bookingId, file, senderName });
  };

  return (
    <div className="space-y-5 rounded-3xl bg-canvas p-4 ring-1 ring-line ml:p-5">
      <h3 className="font-display text-lg font-semibold tracking-tight text-ink">Unggah bukti transfer</h3>

      <div className="space-y-2">
        <Label htmlFor="sender">Nama pengirim (sesuai rekening)</Label>
        <Input
          id="sender"
          placeholder="Budi Santoso"
          autoComplete="name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          disabled={upload.isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Foto struk / screenshot</Label>

        {file && preview ? (
          <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Pratinjau bukti transfer" className="size-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
              <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={upload.isPending}
              aria-label="Hapus file"
              className="grid size-10 shrink-0 place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-50"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        ) : (
          <label
            htmlFor="file"
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface px-4 py-8 text-center transition hover:border-ink",
              upload.isPending && "pointer-events-none opacity-50",
            )}
          >
            <ImagePlus className="size-7 text-muted" aria-hidden />
            <span className="text-sm font-semibold text-ink">Pilih foto bukti transfer</span>
            <span className="text-xs text-muted">JPG, PNG, atau WebP</span>
          </label>
        )}

        <input
          id="file"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={upload.isPending}
        />
      </div>

      <Button
        size="lg"
        variant="signal"
        className="h-14 w-full text-base"
        onClick={handleUpload}
        disabled={upload.isPending || !file || !senderName}
      >
        {upload.isPending ? "Mengunggah..." : "Kirim bukti pembayaran"}
      </Button>
    </div>
  );
}
