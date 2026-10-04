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
            <Button variant="destructive" className="w-full" onClick={() => setOpen(true)}>
                Tolak
            </Button>
        );
    }

    return (
        <div className="w-full space-y-2">
            <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Alasan penolakan, misalnya nominal tidak sesuai"
                className="w-full rounded-md border border-zinc-300 p-2 text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
                <Button variant="destructive" className="w-full" onClick={submit} disabled={loading}>
                    {loading ? "Memproses..." : "Kirim penolakan"}
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                    Batal
                </Button>
            </div>
        </div>
    );
}