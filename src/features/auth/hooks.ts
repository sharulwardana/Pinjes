import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { LoginInput, RegisterInput } from "./schemas";
import type { RoleKey } from "@prisma/client";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  storeId: string | null;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

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

export function useAuth() {
  const { data: user, isLoading } = useQuery<SessionUser | null>({
    queryKey: ["auth", "me"],
    queryFn: () => fetchApi("/api/auth/me"),
  });

  return { user, isLoading };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ next: _next, ...data }: LoginInput & { next?: string }) =>
      fetchApi<{ id: string; role: RoleKey }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      toast.success("Berhasil masuk");
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

      const next = variables?.next;
      if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
        router.push(next);
        return;
      }

      if (data.role === "ADMIN") router.push("/admin");
      else if (data.role === "STORE_OWNER") router.push("/dashboard/store");
      else router.push("/orders");
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal masuk");
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ next: _next, ...data }: RegisterInput & { next?: string }) =>
      fetchApi<{ id: string; role: RoleKey }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      toast.success("Pendaftaran berhasil");
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });

      const next = variables?.next;
      if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
        router.push(next);
        return;
      }

      if (data.role === "STORE_OWNER") router.push("/dashboard/store");
      else router.push("/orders");
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal mendaftar");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => fetchApi("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      toast.success("Berhasil keluar");
      queryClient.setQueryData(["auth", "me"], null);
      router.push("/login");
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal keluar");
    },
  });
}
