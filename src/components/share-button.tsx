"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  title: string;
  className?: string;
}

export function ShareButton({ title, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        // User cancelled share dialog or not supported
        if ((err as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Tautan barang berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin tautan.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Bagikan barang ini"
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-xs font-semibold text-ink shadow-xs transition duration-200 hover:border-ink hover:bg-canvas active:scale-95",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.25, 1], opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center text-brand"
          >
            <Check className="size-4" aria-hidden />
          </motion.span>
        ) : (
          <motion.span
            key="share"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center"
          >
            <Share2 className="size-4" aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
      <span>{copied ? "Tersalin!" : "Bagikan"}</span>
    </button>
  );
}
