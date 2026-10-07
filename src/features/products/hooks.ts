import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { CreateProductInput } from "./schemas";

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

export function useStoreProducts() {
  return useQuery<any[]>({
    queryKey: ["store", "products"],
    queryFn: () => fetchApi("/api/store/products").then((res: any) => res.items),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateProductInput) =>
      fetchApi("/api/store/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Barang berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["store", "products"] });
      router.push("/dashboard/store/products");
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menambahkan barang");
    },
  });
}

export function useUploadProductImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("kind", "product");
      fd.append("file", file);

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal upload gambar");
      return json.data.path as string;
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal upload gambar");
    },
  });
}

export function useStoreProduct(id: string) {
  return useQuery({
    queryKey: ["store", "products", id],
    queryFn: () => fetchApi<any>(`/api/store/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateProductInput }) =>
      fetchApi(`/api/store/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      toast.success("Barang berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["store", "products"] });
      queryClient.invalidateQueries({ queryKey: ["store", "products", variables.id] });
      router.push("/dashboard/store/products");
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal memperbarui barang");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/store/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Barang berhasil dinonaktifkan");
      queryClient.invalidateQueries({ queryKey: ["store", "products"] });
      router.push("/dashboard/store/products");
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menonaktifkan barang");
    },
  });
}
