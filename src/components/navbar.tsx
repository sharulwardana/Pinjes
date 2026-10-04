"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useLogout } from "@/features/auth/hooks";
import { Button } from "./ui/button";

export function Navbar() {
  const { user, isLoading } = useAuth();
  const logout = useLogout();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]">
      <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-black text-lg tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
              P<span className="text-emerald-400">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                Pinje<span className="text-blue-600">S</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-600 uppercase font-semibold">
                Pinjam Sebentar
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/search"
              className={`transition-colors hover:text-slate-900 ${
                pathname === "/search" ? "text-slate-900 font-semibold" : "text-slate-500"
              }`}
            >
              Katalog Universal
            </Link>
            <Link
              href="/search?category=kamera"
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              Kamera & Drone
            </Link>
            <Link
              href="/search?category=camping"
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              Outdoor & Camping
            </Link>
            <Link
              href="/search?category=kendaraan"
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              Motor & Sepeda
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/60 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono">RADAR O2O AKTIF</span>
          </Link>

          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <>
              {user.role === "STORE_OWNER" ? (
                <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 font-medium">
                  <Link href="/dashboard/store">Dashboard Toko</Link>
                </Button>
              ) : user.role === "ADMIN" ? (
                <Button variant="outline" size="sm" asChild className="rounded-xl border-blue-200 text-blue-700 bg-blue-50 font-medium hover:bg-blue-100">
                  <Link href="/admin">Panel Admin</Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild className="rounded-xl text-slate-700">
                  <Link href="/orders">Pesanan Saya</Link>
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout.mutate()} 
                disabled={logout.isPending}
                className="rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50"
              >
                Keluar
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="rounded-xl text-slate-700 hover:bg-slate-100 font-medium">
                <Link href="/login">Masuk</Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 shadow-sm hover:shadow transition-all">
                <Link href="/register">Mulai Pinjam</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
