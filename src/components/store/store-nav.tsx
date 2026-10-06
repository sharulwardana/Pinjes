"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, Package, ReceiptText, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
}

/**
 * Navigasi dashboard toko.
 * HP: baris tab yang bisa digeser di atas konten (navigasi bawah global sudah dipakai MobileNav).
 * Tablet ke atas: sidebar menempel di kiri.
 */
export function StoreNav({ awaitingCheck }: { awaitingCheck: number }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard/store", label: "Ringkasan", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/store/orders", label: "Pesanan masuk", icon: ReceiptText, badge: awaitingCheck },
    { href: "/dashboard/store/products", label: "Barang", icon: Package },
    { href: "/dashboard/store/deposit", label: "Deposit", icon: CreditCard },
    { href: "/dashboard/store/settings", label: "Pengaturan", icon: Settings },
  ];

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav aria-label="Kelola toko" className="-mx-4 md:mx-0">
      <ul className="hide-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 md:flex-col md:gap-1 md:overflow-visible md:px-0">
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-2.5 rounded-full px-4 text-sm font-semibold transition duration-300 ease-out-expo md:rounded-2xl",
                  active ? "bg-ink text-canvas" : "bg-surface text-muted ring-1 ring-line hover:text-ink md:bg-transparent md:ring-0 md:hover:bg-ink/5",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
                {item.badge ? (
                  <span
                    className={cn(
                      "ml-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] leading-5 font-bold",
                      active ? "bg-signal text-ink" : "bg-brand text-accent-foreground",
                    )}
                    aria-label={`${item.badge} perlu diperiksa`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
