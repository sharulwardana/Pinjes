"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number | string;
  className?: string;
}

/**
 * Tampilan angka / harga dengan animasi rolling flip vertikal yang halus.
 */
export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  return (
    <span className={cn("relative inline-flex overflow-hidden align-baseline", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ y: "50%", opacity: 0, filter: "blur(2px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-50%", opacity: 0, filter: "blur(2px)" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
