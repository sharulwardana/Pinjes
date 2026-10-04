import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { CreateBookingInput } from "./schemas";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.message || "Terjadi kesalahan") as any;
    err.info = json;
    err.status = res.status;
    throw err;
  }
  return json.data;
}

export function useCreateBooking() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingInput) =>
      fetchApi<{ id: string; code: string }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      toast.success("Pesanan berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.push(`/orders/${data.code}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal membuat pesanan");
    },
  });
}

export function useUploadPayment() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { bookingId: string; file: File; senderName: string }) => {
      // 1. Upload file
      const fd = new FormData();
      fd.append("kind", "payment-proof");
      fd.append("file", data.file);

      const upRes = await fetch("/api/files/upload", {
        method: "POST",
        body: fd,
      });
      const upJson = await upRes.json();
      if (!upRes.ok) throw new Error(upJson.message || "Gagal upload gambar");

      // 2. Hubungkan ke pesanan
      return fetchApi("/api/bookings/payment", {
        method: "POST",
        body: JSON.stringify({
          bookingId: data.bookingId,
          fileId: upJson.data.path,
          senderName: data.senderName,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Bukti transfer berhasil diunggah!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal mengunggah bukti transfer");
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (bookingId: string) =>
      fetchApi("/api/bookings/payment/confirm", {
        method: "POST",
        body: JSON.stringify({ bookingId }),
      }),
    onSuccess: () => {
      toast.success("Pembayaran dikonfirmasi!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal konfirmasi");
    },
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string, status: string }) => {
      const res = await fetch("/api/bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    onSuccess: () => {
      toast.success("Status pesanan berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal memperbarui status.");
    }
  });
}