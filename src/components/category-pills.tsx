"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface CategoryPillItem {
  id: string;
  name: string;
  slug?: string;
  href: string;
}

interface CategoryPillsProps {
  items: CategoryPillItem[];
  activeSlug?: string;
}

export function CategoryPills({ items, activeSlug }: CategoryPillsProps) {
  return (
    <nav
      aria-label="Kategori"
      className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
    >
      {items.map((c) => {
        const isActive = c.slug === undefined ? !activeSlug : activeSlug === c.slug;

        return (
          <Link
            key={c.id}
            href={c.href}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "relative inline-flex h-11 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-200 active:scale-95",
              isActive ? "text-canvas" : "bg-surface text-ink ring-1 ring-line hover:ring-ink",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="activeCategoryPill"
                className="absolute inset-0 -z-10 rounded-full bg-ink shadow-xs"
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                }}
              />
            )}
            <span className="relative z-10">{c.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
