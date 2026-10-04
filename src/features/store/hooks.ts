"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ApiError extends Error {
  fieldErrors?: Record<string, string[]>;
}

export function useUpdateStoreSettings() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/store/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        const firstFieldError = Object.values(json.errors ?? {}).flat()[0] as string | undefined;
        const err = new Error(firstFieldError || json.message || "Gagal menyimpan") as ApiError;
        err.fieldErrors = json.errors;
        throw err;
      }
      return json;
    },
    onSuccess: () => {
      toast.success("Pengaturan toko berhasil disimpan!");
      router.refresh();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyimpan pengaturan");
    },
  });
}