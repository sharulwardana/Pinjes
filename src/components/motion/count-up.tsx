"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/** Angka yang berhitung naik saat terlihat di layar. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce || hasAnimated.current) return;
    hasAnimated.current = true;

    const format = (n: number) => Math.round(n).toLocaleString("id-ID");

    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("id-ID")}
    </span>
  );
}
