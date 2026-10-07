"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  /** Path relatif dari database, contoh: "product/xxxx.jpg". */
  path: string;
  alt: string;
  className?: string;
  /** true untuk gambar di bagian atas halaman (dimuat lebih dulu). */
  priority?: boolean;
}

/**
 * Satu pintu untuk semua foto barang. Dilengkapi fallback visual jika gambar rusak/hilang.
 */
export function ProductImage({ path, alt, className, priority = false }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={cn("grid size-full place-items-center bg-line/60 text-muted", className)}>
        <ImageOff className="size-6 opacity-50" aria-label="Foto tidak dapat dimuat" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/files/${path}`}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
