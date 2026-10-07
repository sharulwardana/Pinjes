"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  productId: string;
  initialFavorited?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
  productId,
  initialFavorited = false,
  className,
  showLabel = true,
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, setIsPending] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info("Masuk terlebih dahulu untuk menyimpan barang favorit.");
      return;
    }

    const nextState = !favorited;
    setFavorited(nextState);
    setIsPending(true);

    try {
      const res = await fetch(`/api/products/${productId}/favorite`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const actualState = json.data?.favorited ?? nextState;
      setFavorited(actualState);
      toast.success(actualState ? "Disimpan ke favorit!" : "Dihapus dari favorit.");
    } catch {
      setFavorited(!nextState);
      toast.error("Gagal memperbarui favorit.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={favorited ? "Hapus dari favorit" : "Tambah ke favorit"}
      aria-pressed={favorited}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-xs font-semibold text-ink shadow-xs transition duration-200 hover:border-ink hover:bg-canvas active:scale-95 disabled:opacity-60",
        favorited && "border-rose-200 bg-rose-50/50 text-rose-700 hover:border-rose-300",
        className,
      )}
    >
      <motion.span
        key={String(favorited)}
        animate={{ scale: [1, 1.28, 0.92, 1] }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center"
      >
        <Heart
          className={cn(
            "size-4 transition-colors duration-200",
            favorited ? "fill-rose-500 text-rose-500" : "text-ink",
          )}
          aria-hidden
        />
      </motion.span>
      {showLabel && <span>{favorited ? "Tersimpan" : "Favorit"}</span>}
    </button>
  );
}
