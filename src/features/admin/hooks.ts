import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Prisma } from "@prisma/client";

type DepositWithStore = Prisma.DepositGetPayload<{
  include: { store: { select: { id: true; name: true } } }
}>;

export interface PendingStore {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  description: string;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  qrisImagePath: string | null;
  submittedAt: string | null;
  owner: { name: string; email: string };
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message);
  return json.data;
}

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
    mutationFn: (depositId: string) => postJson("/api/admin/deposits/approve", { depositId }),
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
    mutationFn: (v: { depositId: string; reason: string }) => postJson("/api/admin/deposits/reject", v),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-deposits"] });
      toast.success("Deposit ditolak.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menolak deposit.");
    }
  });
}

export function usePendingStores() {
  return useQuery({
    queryKey: ["admin-pending-stores"],
    queryFn: async (): Promise<PendingStore[]> => {
      const res = await fetch("/api/admin/stores");
      if (!res.ok) throw new Error("Gagal mengambil data toko.");
      const json = await res.json();
      return json.data;
    }
  });
}

export function useApproveStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storeId: string) => postJson("/api/admin/stores/approve", { storeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-stores"] });
      toast.success("Toko disetujui.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyetujui toko.");
    }
  });
}

export function useRejectStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { storeId: string; reason: string }) => postJson("/api/admin/stores/reject", v),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-stores"] });
      toast.success("Toko ditolak.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menolak toko.");
    }
  });
}