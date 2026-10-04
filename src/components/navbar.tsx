"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { useAuth, useLogout } from "@/features/auth/hooks";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/search", label: "Jelajahi" },
  { href: "/search?category=kamera", label: "Kamera" },
  { href: "/search?category=camping", label: "Camping" },
  { href: "/search?category=kendaraan", label: "Kendaraan" },
];

function accountLink(role?: string) {
  if (role === "ADMIN") return { href: "/admin", label: "Panel admin" };
  if (role === "STORE_OWNER") return { href: "/dashboard/store", label: "Dashboard toko" };
  return { href: "/orders", label: "Pesanan saya" };
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-0.5 font-display text-2xl font-bold tracking-tight text-ink", className)}>
      pinjes
      <span aria-hidden className="size-2 translate-y-[-0.1em] rounded-full bg-signal ring-2 ring-ink" />
    </span>
  );
}

export function Navbar() {
  const { user, isLoading } = useAuth();
  const logout = useLogout();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const account = accountLink(user?.role);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu penuh layar: kunci scroll dan tutup dengan Escape.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 pt-3 md:pt-4">
      <div className="shell">
        <div
          className={cn(
            "flex h-14 items-center justify-between gap-3 rounded-full border pl-5 pr-2 transition-all duration-500 ease-out-expo md:h-16",
            scrolled
              ? "border-line bg-surface/80 shadow-[0_12px_40px_-16px_rgb(0_0_0/0.25)] backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          <Link href="/" aria-label="PinjeS, ke beranda" className="shrink-0">
            <Wordmark />
          </Link>

          <nav aria-label="Menu utama" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => {
              const active = !link.href.includes("?") && pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
                    active ? "bg-ink text-canvas" : "text-muted hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 md:gap-2">
            <Link
              href="/search"
              aria-label="Cari barang"
              className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-ink/5"
            >
              <Search className="size-5" aria-hidden />
            </Link>

            {isLoading ? (
              <div className="hidden h-11 w-32 animate-pulse rounded-full bg-ink/5 md:block" />
            ) : user ? (
              <>
                <Link
                  href={account.href}
                  className="hidden h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-canvas transition hover:bg-ink/85 md:inline-flex"
                >
                  {account.label}
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="hidden h-11 items-center rounded-full px-3 text-sm font-medium text-muted transition-colors hover:text-ink disabled:opacity-50 md:inline-flex"
                >
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-11 items-center rounded-full px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 md:inline-flex"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="hidden h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-canvas transition hover:bg-ink/85 md:inline-flex"
                >
                  Mulai sewa
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </>
            )}

            <button
              type="button"
              aria-label="Buka menu"
              aria-expanded={open}
              aria-controls="menu-mobile"
              onClick={() => setOpen(true)}
              className="grid size-11 place-items-center rounded-full bg-ink text-canvas transition active:scale-95 md:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-mobile"
            role="dialog"
            aria-modal="true"
            aria-label="Menu utama"
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-canvas px-5 pb-8 pt-3 md:hidden"
            initial={{ clipPath: "circle(0% at 90% 4%)" }}
            animate={{ clipPath: "circle(150% at 90% 4%)" }}
            exit={{ clipPath: "circle(0% at 90% 4%)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex h-14 items-center justify-between pl-2">
              <Link href="/" onClick={() => setOpen(false)} aria-label="PinjeS, ke beranda">
                <Wordmark />
              </Link>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setOpen(false)}
                className="grid size-11 place-items-center rounded-full bg-ink text-canvas transition active:scale-95"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <ul className="mt-8 flex flex-col">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-line"
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-5 font-display text-4xl font-bold tracking-tight text-ink xs:text-5xl"
                  >
                    {link.label}
                    <ArrowUpRight className="size-7 text-muted" aria-hidden />
                  </Link>
                </motion.li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-3 pt-10">
              {user ? (
                <>
                  <Link
                    href={account.href}
                    onClick={() => setOpen(false)}
                    className="flex h-14 items-center justify-center rounded-full bg-ink text-base font-semibold text-canvas"
                  >
                    {account.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logout.mutate();
                    }}
                    className="flex h-14 items-center justify-center rounded-full border border-line text-base font-semibold text-ink"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="flex h-14 items-center justify-center rounded-full bg-signal text-base font-semibold text-ink"
                  >
                    Mulai sewa
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex h-14 items-center justify-center rounded-full border border-line text-base font-semibold text-ink"
                  >
                    Masuk
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
