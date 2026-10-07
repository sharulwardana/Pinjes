"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProductSchema,
  type CreateProductInput,
  PRODUCT_CATEGORIES,
} from "@/features/products/schemas";
import {
  useDeleteProduct,
  useStoreProduct,
  useUpdateProduct,
  useUploadProductImage,
} from "@/features/products/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditProductFormProps {
  id: string;
  product: {
    name: string;
    category: "kamera" | "camping" | "elektronik" | "kendaraan" | "fashion" | "lainnya";
    description: string;
    pricePerDay: number;
    securityDeposit?: number;
    deposit?: number;
    stock: number;
    minRentalDays?: number;
    maxRentalDays?: number;
    rentalTerms?: string;
    status: "ACTIVE" | "DRAFT" | "INACTIVE";
    photos?: string[];
  };
}

function EditProductForm({ id, product }: EditProductFormProps) {
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();
  const uploadMut = useUploadProductImage();
  const [photos, setPhotos] = useState<string[]>(product.photos ?? []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: product.name,
      category: product.category,
      description: product.description,
      pricePerDay: product.pricePerDay,
      deposit: product.securityDeposit ?? product.deposit ?? 0,
      stock: product.stock,
      minRentalDays: product.minRentalDays ?? 1,
      maxRentalDays: product.maxRentalDays ?? 30,
      rentalTerms: product.rentalTerms ?? "",
      status: product.status ?? "ACTIVE",
      photos: product.photos ?? [],
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const path = await uploadMut.mutateAsync(file);
      const newPhotos = [...photos, path];
      setPhotos(newPhotos);
      setValue("photos", newPhotos, { shouldValidate: true });
    } catch {
      // toast handled in hook
    } finally {
      e.target.value = "";
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
    setValue("photos", newPhotos, { shouldValidate: true });
  };

  const onSubmit = (data: any) => {
    updateMut.mutate({ id, data: data as CreateProductInput });
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/store/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Kembali ke daftar barang
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Edit Barang
          </h1>
          <p className="mt-1 text-sm text-muted">Perbarui tarif, stok, atau rincian barang sewa.</p>
        </div>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={deleteMut.isPending}
          onClick={() => {
            if (confirm("Apakah kamu yakin ingin menonaktifkan barang ini?")) {
              deleteMut.mutate(id);
            }
          }}
          className="rounded-full"
        >
          <Trash2 className="size-4" />
          {deleteMut.isPending ? "Memproses..." : "Nonaktifkan"}
        </Button>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-4xl border border-line bg-surface p-6 shadow-sm md:p-8"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="name">Nama Barang</Label>
          <Input id="name" {...register("name")} disabled={updateMut.isPending} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <select
              id="category"
              className="flex h-11 w-full rounded-full border border-line bg-canvas px-4 py-2 text-sm text-ink capitalize transition focus:border-ink focus:outline-none"
              {...register("category")}
              disabled={updateMut.isPending}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status Tampil</Label>
            <select
              id="status"
              className="flex h-11 w-full rounded-full border border-line bg-canvas px-4 py-2 text-sm text-ink transition focus:border-ink focus:outline-none"
              {...register("status")}
              disabled={updateMut.isPending}
            >
              <option value="ACTIVE">Aktif (Tampil di pencarian)</option>
              <option value="DRAFT">Draf (Disembunyikan)</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi Barang</Label>
          <Textarea
            id="description"
            rows={4}
            className="rounded-2xl"
            {...register("description")}
            disabled={updateMut.isPending}
          />
          {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="pricePerDay">Tarif Sewa / Hari (Rp)</Label>
            <Input
              id="pricePerDay"
              type="number"
              {...register("pricePerDay")}
              disabled={updateMut.isPending}
            />
            {errors.pricePerDay && <p className="text-xs text-red-600">{errors.pricePerDay.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit">Uang Jaminan (Rp)</Label>
            <Input
              id="deposit"
              type="number"
              {...register("deposit")}
              disabled={updateMut.isPending}
            />
            {errors.deposit && <p className="text-xs text-red-600">{errors.deposit.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stok Unit Tersedia</Label>
            <Input id="stock" type="number" {...register("stock")} disabled={updateMut.isPending} />
            {errors.stock && <p className="text-xs text-red-600">{errors.stock.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="minRentalDays">Minimal Hari Sewa</Label>
            <Input
              id="minRentalDays"
              type="number"
              min={1}
              {...register("minRentalDays")}
              disabled={updateMut.isPending}
            />
            {errors.minRentalDays && <p className="text-xs text-red-600">{errors.minRentalDays.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRentalDays">Maksimal Hari Sewa</Label>
            <Input
              id="maxRentalDays"
              type="number"
              min={1}
              {...register("maxRentalDays")}
              disabled={updateMut.isPending}
            />
            {errors.maxRentalDays && <p className="text-xs text-red-600">{errors.maxRentalDays.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rentalTerms">Syarat & Ketentuan Sewa</Label>
          <Textarea
            id="rentalTerms"
            rows={3}
            className="rounded-2xl"
            {...register("rentalTerms")}
            disabled={updateMut.isPending}
          />
          {errors.rentalTerms && <p className="text-xs text-red-600">{errors.rentalTerms.message}</p>}
        </div>

        <div className="space-y-3 border-t border-line pt-6">
          <div className="flex items-center justify-between">
            <Label>Foto Barang (Min 1, Maks 5)</Label>
            <span className="text-xs text-muted">{photos.length}/5 foto</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {photos.map((photo, i) => (
              <div
                key={photo}
                className="group relative size-24 overflow-hidden rounded-2xl border border-line bg-canvas shadow-xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${photo}`} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label="Hapus foto"
                  className="absolute inset-0 flex items-center justify-center bg-ink/60 text-canvas opacity-0 transition group-hover:opacity-100"
                  onClick={() => removePhoto(i)}
                >
                  <X className="size-5" />
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <label className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line bg-canvas text-muted transition hover:border-ink hover:text-ink">
                <ImagePlus className="size-6" />
                <span className="text-[0.6875rem] font-semibold">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploadMut.isPending || updateMut.isPending}
                />
              </label>
            )}
          </div>
          {errors.photos && <p className="text-xs text-red-600">{errors.photos.message}</p>}
        </div>

        <div className="flex gap-3 border-t border-line pt-6">
          <Button
            type="submit"
            size="lg"
            variant="signal"
            className="h-12 flex-1 text-base font-bold text-ink"
            disabled={updateMut.isPending || uploadMut.isPending}
          >
            {updateMut.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12">
            <Link href="/dashboard/store/products">Batal</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: product, isLoading, isError } = useStoreProduct(id);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted">
        Memuat data barang...
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-base font-semibold text-ink">Barang tidak ditemukan.</p>
        <Link
          href="/dashboard/store/products"
          className="inline-flex text-sm font-semibold text-brand underline underline-offset-4"
        >
          Kembali ke daftar barang
        </Link>
      </div>
    );
  }

  return <EditProductForm id={id} product={product} />;
}
