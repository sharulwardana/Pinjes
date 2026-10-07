"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RejectPaymentBtn({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (reason.trim().length < 3) {
      setError("Tulis alasan penolakan.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/payment/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason: reason.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? "Gagal menolak pembayaran.");
        return;
      }
      router.refresh();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="w-full rounded-full" onClick={() => setOpen(true)}>
        Tolak pembayaran
      </Button>
    );
  }

  return (
    <div className="w-full space-y-2 rounded-2xl bg-canvas p-3 ring-1 ring-line">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={300}
        rows={3}
        placeholder="Alasan penolakan, misalnya nominal tidak sesuai..."
        aria-label="Alasan penolakan pembayaran"
        className="w-full resize-none rounded-xl border border-line bg-surface p-2.5 text-xs text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none"
      />
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          className="flex-1 rounded-full text-xs font-semibold"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Memproses..." : "Kirim penolakan"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full text-xs"
          onClick={() => setOpen(false)}
          disabled={loading}
        >
          Batal
        </Button>
      </div>
    </div>
  );
}