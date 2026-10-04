import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Prisma } from "@prisma/client";

type DepositWithStore = Prisma.DepositGetPayload<{
  include: { store: { select: { id: true; name: true } } }
}>;

export function usePendingDeposits() {
  return useQuery({
    queryKey: ["admin-pending-deposits"],
    queryFn: async (): Promise<DepositWithStore[]> => {
      const res = await fetch("/api/admin/deposits");
      if (!res.ok) throw new Error("Gagal mengambil data deposit.");
      const json = await res.json();
      return json.data;
    }
  });
}

export function useApproveDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (depositId: string) => {
      const res = await fetch("/api/admin/deposits/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-deposits"] });
      toast.success("Deposit berhasil disetujui.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyetujui deposit.");
    }
  });
}

export function useRejectDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ depositId, reason }: { depositId: string; reason: string }) => {
      const res = await fetch("/api/admin/deposits/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId, reason })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-deposits"] });
      toast.success("Deposit ditolak.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menolak deposit.");
    }
  });
}