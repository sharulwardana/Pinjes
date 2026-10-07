"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag, Store } from "lucide-react";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/motion/reveal";
import { Wordmark } from "@/components/navbar";

const ACCOUNT_TYPES = [
  { value: "renter", label: "Penyewa", icon: ShoppingBag },
  { value: "owner", label: "Pemilik toko", icon: Store },
] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-red-600">
      {message}
    </p>
  );
}

function RegisterForm() {
  const registerMut = useRegister();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || undefined;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { accountType: "renter" },
  });

  const accountType = useWatch({ control, name: "accountType" });

  const onSubmit = (data: RegisterInput) => {
    registerMut.mutate({ ...data, next });
  };

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      {/* Panel merek split-screen, seragam dengan halaman masuk */}
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-canvas lg:flex lg:flex-col lg:justify-between 2xl:p-16">
        <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <span className="font-display text-3xl font-bold tracking-tight">pinjes</span>
        </div>
        <div className="relative max-w-lg">
          <p className="text-eyebrow text-signal">Ekosistem rental lokal</p>
          <p className="text-display mt-5 text-canvas" style={{ fontSize: "clamp(2.5rem, 1rem + 3.6vw, 5rem)" }}>
            Mulai sewa atau buka tokomu sendiri.
          </p>
        </div>
      </aside>

      {/* Formulir pendaftaran */}
      <section className="flex items-center justify-center px-5 py-12 md:py-20">
        <Reveal immediate className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>

          <h1 className="text-title text-ink">Daftar PinjeS</h1>
          <p className="mt-3 text-base text-muted">Mulai menyewa barang atau daftarkan toko rentalmu di sekitarmu.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-ink">Daftar sebagai</legend>
              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    htmlFor={`type-${value}`}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-line bg-surface p-4 transition-colors hover:border-ink/40 has-checked:border-brand has-checked:bg-brand-soft/40 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
                  >
                    <input
                      type="radio"
                      id={`type-${value}`}
                      value={value}
                      className="sr-only"
                      {...register("accountType")}
                      disabled={registerMut.isPending}
                    />
                    <Icon className="size-6 text-ink/75" aria-hidden />
                    <span className="text-sm font-semibold text-ink">{label}</span>
                  </label>
                ))}
              </div>
              <FieldError message={errors.accountType?.message} />
            </fieldset>

            {accountType === "owner" && (
              <p className="rounded-2xl bg-canvas p-4 text-xs leading-relaxed text-muted ring-1 ring-line">
                Setelah mendaftar, lengkapi profil toko di Pengaturan Toko dan top-up saldo deposit agar tokomu bisa menerima pesanan.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nama lengkap</Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Budi Santoso"
                {...register("name")}
                disabled={registerMut.isPending}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                {...register("email")}
                disabled={registerMut.isPending}
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                {...register("password")}
                disabled={registerMut.isPending}
              />
              <FieldError message={errors.password?.message} />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={registerMut.isPending}>
              {registerMut.isPending ? "Memproses..." : "Daftar sekarang"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Sudah punya akun?{" "}
            <Link
              href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              Masuk
            </Link>
          </p>
        </Reveal>
      </section>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-12 text-sm text-muted">
          Memuat...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}