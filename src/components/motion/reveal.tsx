"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

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
 * Pengguna yang mematikan animasi di sistemnya diatur oleh <MotionConfig> di Providers.
 */
export function Reveal({ children, className, delay = 0, y = 28, immediate = false }: RevealProps) {
  const transition = { duration: 0.8, ease: EASE, delay };

  if (immediate) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

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
