"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingBag, Store } from "lucide-react";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function RegisterPage() {
  const registerMut = useRegister();
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
    registerMut.mutate(data);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Daftar PinjeS</CardTitle>
          <CardDescription>Mulai menyewa atau daftarkan toko rentalmu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-zinc-900">Daftar sebagai</legend>
              <div className="grid grid-cols-2 gap-4">
                {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    htmlFor={`type-${value}`}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 has-checked:border-accent has-checked:bg-accent/5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                  >
                    <input
                      type="radio"
                      id={`type-${value}`}
                      value={value}
                      className="sr-only"
                      {...register("accountType")}
                      disabled={registerMut.isPending}
                    />
                    <Icon className="h-6 w-6 text-zinc-700" aria-hidden />
                    <span className="text-sm font-semibold">{label}</span>
                  </label>
                ))}
              </div>
              <FieldError message={errors.accountType?.message} />
            </fieldset>

            {accountType === "owner" && (
              <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
                Setelah mendaftar, lengkapi profil dan rekening tokomu di Pengaturan Toko, lalu top-up saldo deposit
                supaya tokomu bisa menerima pesanan.
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
                {...register("password")}
                disabled={registerMut.isPending}
              />
              <FieldError message={errors.password?.message} />
            </div>

            <Button type="submit" className="w-full" disabled={registerMut.isPending}>
              {registerMut.isPending ? "Memproses..." : "Daftar sekarang"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Masuk
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}