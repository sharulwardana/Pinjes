import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateDepositInput } from "./schemas";
import type { Deposit } from "@prisma/client";

export function useTopupDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDepositInput) => {
      const res = await fetch("/api/store/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal mengirim permintaan top-up.");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-deposits"] });
      toast.success("Permintaan top-up berhasil dikirim dan sedang menunggu verifikasi admin.");
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });
}

export function useStoreDeposits() {
  return useQuery({
    queryKey: ["store-deposits"],
    queryFn: async (): Promise<Deposit[]> => {
      const res = await fetch("/api/store/deposit");
      if (!res.ok) throw new Error("Gagal mengambil riwayat deposit.");
      const json = await res.json();
      return json.data;
    },
  });
}
