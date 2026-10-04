"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "@/features/auth/hooks";
import { registerSchema, type RegisterInput } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          <CardDescription>Mulai menyewa atau buka toko rentalmu hari ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Label
                htmlFor="type-renter"
                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-zinc-900 has-data-[state=checked]:border-zinc-900 ${accountType === "renter" ? "border-zinc-900 ring-1 ring-zinc-900 bg-zinc-50" : "border-zinc-200"
                  } cursor-pointer`}
              >
                <input
                  type="radio"
                  id="type-renter"
                  value="renter"
                  className="sr-only"
                  {...register("accountType")}
                  disabled={registerMut.isPending}
                />
                <span className="mb-2 text-xl block">🛒</span>
                <span className="text-sm font-semibold text-center block">Penyewa</span>
              </Label>

              <Label
                htmlFor="type-owner"
                className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-zinc-900 has-data-[state=checked]:border-zinc-900 ${accountType === "owner" ? "border-zinc-900 ring-1 ring-zinc-900 bg-zinc-50" : "border-zinc-200"
                  } cursor-pointer`}
              >
                <input
                  type="radio"
                  id="type-owner"
                  value="owner"
                  className="sr-only"
                  {...register("accountType")}
                  disabled={registerMut.isPending}
                />
                <span className="mb-2 text-xl block">🏪</span>
                <span className="text-sm font-semibold text-center block">Pemilik Toko</span>
              </Label>
            </div>
            {errors.accountType && <p className="text-sm text-red-500">{errors.accountType.message}</p>}

            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                placeholder="Budi Santoso"
                {...register("name")}
                disabled={registerMut.isPending}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                {...register("email")}
                disabled={registerMut.isPending}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={registerMut.isPending}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={registerMut.isPending}>
              {registerMut.isPending ? "Memproses..." : "Daftar Sekarang"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-zinc-900 hover:underline">
              Masuk
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
