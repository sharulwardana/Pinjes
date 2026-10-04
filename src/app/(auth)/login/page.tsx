"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/features/auth/hooks";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login.mutate(data);
  };

  const handleQuickFill = (email: string, pass: string) => {
    setValue("email", email);
    setValue("password", pass);
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4 bg-tech-grid">
      <Card className="mx-auto w-full max-w-md rounded-3xl border-slate-200/90 shadow-xl bg-white/95 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-lg">
            P<span className="text-emerald-400">S</span>
          </div>
          <CardTitle className="text-2xl font-black text-slate-950">Masuk ke PinjeS</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Akses akun Anda untuk menyewa atau mengelola toko rental.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                {...register("email")}
                disabled={login.isPending}
                className="rounded-xl"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={login.isPending}
                className="rounded-xl"
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.01]"
              disabled={login.isPending}
            >
              {login.isPending ? "Memproses Autentikasi..." : "Masuk ke Akun"}
            </Button>
          </form>

          {/* Quick Login Helper Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
              Akses Cepat Pengujian (1-Klik Isi)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@pinjes.id", "admin12345")}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-left transition-colors text-xs"
              >
                <span className="font-bold block text-slate-900">👑 Super Admin</span>
                <span className="text-[10px] text-slate-500 font-mono">admin@pinjes.id</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("dimas.kamera@pinjes.id", "pinjes2026")}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-left transition-colors text-xs"
              >
                <span className="font-bold block text-slate-900">🏪 Pemilik Toko</span>
                <span className="text-[10px] text-slate-500 font-mono">dimas.kamera@...</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-bold text-blue-600 hover:underline">
              Daftar akun baru di sini
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
