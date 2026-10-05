"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { House, Package, Search, ShieldCheck, Store, User, type LucideIcon } from "lucide-react";
import { useAuth } from "@/features/auth/hooks";
import { cn } from "@/lib/utils";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Bottom navigation untuk layar di bawah 768px (Mobile S sampai Mobile L). */
export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Halaman masuk/daftar tidak perlu navigasi bawah. Halaman barang (/p/...)
  // punya bar harga sendiri di dasar layar, jadi navigasi ini disembunyikan di sana.
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/p/")) return null;

  const items: Item[] = [
    { href: "/", label: "Beranda", icon: House },
    { href: "/search", label: "Jelajahi", icon: Search },
  ];

  if (!user) {
    items.push({ href: "/login", label: "Masuk", icon: User });
  } else if (user.role === "ADMIN") {
    items.push({ href: "/admin", label: "Admin", icon: ShieldCheck });
  } else if (user.role === "STORE_OWNER") {
    items.push({ href: "/dashboard/store", label: "Toko", icon: Store });
    items.push({ href: "/orders", label: "Pesanan", icon: Package });
  } else {
    items.push({ href: "/orders", label: "Pesanan", icon: Package });
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-3 bottom-3 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-center rounded-full border border-line bg-surface/85 p-1.5 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.3)] backdrop-blur-xl">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-full text-[0.6875rem] font-semibold transition-colors duration-300",
                  active ? "text-canvas" : "text-muted",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon className="relative size-5" aria-hidden />
                <span className="relative">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
