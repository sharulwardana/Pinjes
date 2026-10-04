interface ProductImageProps {
  /** Path relatif dari database, contoh: "product/xxxx.jpg". */
  path: string;
  alt: string;
  className?: string;
  /** true untuk gambar di bagian atas halaman (dimuat lebih dulu). */
  priority?: boolean;
}

/**
 * Satu pintu untuk semua foto barang. Kalau nanti pindah ke next/image atau CDN
 * (thumbnail beberapa ukuran), cukup ubah file ini.
 */
export function ProductImage({ path, alt, className, priority = false }: ProductImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/files/${path}`}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  );
}
