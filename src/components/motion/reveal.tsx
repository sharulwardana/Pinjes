"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Jeda dalam detik, berguna untuk memberi efek berurutan. */
  delay?: number;
  /** Jarak geser awal dalam piksel. */
  y?: number;
  /** true = langsung beranimasi saat dimuat (untuk bagian paling atas halaman). */
  immediate?: boolean;
}

/**
 * Muncul dengan naik halus. Hanya memakai opacity dan transform supaya ringan.
 * Untuk immediate (atas halaman/hero), memakai CSS animation agar SSR tidak render opacity: 0.
 */
export function Reveal({ children, className, delay = 0, y = 28, immediate = false }: RevealProps) {
  if (immediate) {
    return (
      <div
        className={cn("animate-rise", className)}
        style={delay ? { animationDelay: `${delay}s` } : undefined}
      >
        {children}
      </div>
    );
  }

  const transition = { duration: 0.8, ease: EASE, delay };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
