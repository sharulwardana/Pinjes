"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CancelOrderBtn({ bookingId }: { bookingId: string }) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function cancel() {
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/bookings/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId, status: "CANCELLED", reason: "Dibatalkan oleh pelanggan" }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(json.message ?? "Gagal membatalkan pesanan.");
                return;
            }
            router.refresh();
        } catch {
            setError("Koneksi bermasalah. Coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    if (!confirming) {
        return (
            <Button variant="outline" className="w-full" onClick={() => setConfirming(true)}>
                Batalkan pesanan
            </Button>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-sm text-zinc-700">Yakin ingin membatalkan pesanan ini?</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
                <Button variant="destructive" className="w-full" onClick={cancel} disabled={loading}>
                    {loading ? "Memproses..." : "Ya, batalkan"}
                </Button>
                <Button variant="outline" onClick={() => setConfirming(false)} disabled={loading}>
                    Tidak
                </Button>
            </div>
        </div>
    );
}