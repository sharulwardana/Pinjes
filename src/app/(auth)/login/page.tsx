"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/features/auth/hooks";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/motion/reveal";
import { Wordmark } from "@/components/navbar";

function LoginForm() {
  const login = useLogin();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || undefined;
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login.mutate({ ...data, next });
  };

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      {/* Panel merek, hanya di layar lebar */}
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-canvas lg:flex lg:flex-col lg:justify-between 2xl:p-16">
        <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <span className="font-display text-3xl font-bold tracking-tight">pinjes</span>
        </div>
        <div className="relative max-w-lg">
          <p className="text-eyebrow text-signal">Pinjam sebentar</p>
          <p className="text-display mt-5 text-canvas" style={{ fontSize: "clamp(2.5rem, 1rem + 3.6vw, 5rem)" }}>
            Barang yang kamu butuh, sudah ada yang punya.
          </p>
        </div>
      </aside>

      {/* Formulir */}
      <section className="flex items-center justify-center px-5 py-12 md:py-20">
        <Reveal immediate className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>

          <h1 className="text-title text-ink">Masuk ke PinjeS</h1>
          <p className="mt-3 text-base text-muted">Akses akunmu untuk menyewa barang atau mengelola toko rental.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="nama@email.com"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
                disabled={login.isPending}
              />
              {errors.email && (
                <p role="alert" className="text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password kamu"
                  aria-invalid={Boolean(errors.password)}
                  className="pr-12"
                  {...register("password")}
                  disabled={login.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Belum punya akun?{" "}
            <Link
              href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </Reveal>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-12 text-sm text-muted">
          Memuat...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
