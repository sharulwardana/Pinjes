"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SubmitStoreBtn() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function submit() {
        setLoading(true);
        try {
            const res = await fetch("/api/store/submit", { method: "POST" });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(json.message ?? "Gagal mengajukan toko.");
                return;
            }
            toast.success("Tokomu diajukan untuk ditinjau.");
            router.refresh();
        } catch {
            toast.error("Koneksi bermasalah. Coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button onClick={submit} disabled={loading} size="sm">
            {loading ? "Mengajukan..." : "Ajukan tinjauan"}
        </Button>
    );
}