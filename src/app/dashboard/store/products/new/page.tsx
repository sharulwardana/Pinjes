"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema, type CreateProductInput, PRODUCT_CATEGORIES } from "@/features/products/schemas";
import { useCreateProduct, useUploadProductImage } from "@/features/products/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewProductPage() {
  const createMut = useCreateProduct();
  const uploadMut = useUploadProductImage();
  const [photos, setPhotos] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      status: "ACTIVE",
      photos: [],
      stock: 1,
    }
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
      // error handled by hook
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
    setValue("photos", newPhotos, { shouldValidate: true });
  };

  const onSubmit = (data: any) => {
    createMut.mutate(data as CreateProductInput);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Tambah Barang Baru</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Barang</Label>
          <Input id="name" placeholder="Contoh: Kamera Canon EOS R6" {...register("name")} disabled={createMut.isPending} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <select 
            id="category" 
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
            {...register("category")}
            disabled={createMut.isPending}
          >
            <option value="">-- Pilih Kategori --</option>
            {PRODUCT_CATEGORIES.map(c => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
          {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea 
            id="description" 
            placeholder="Jelaskan kondisi barang, kelengkapan, dll..." 
            className="min-h-30"
            {...register("description")} 
            disabled={createMut.isPending} 
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pricePerDay">Harga Sewa / Hari (Rp)</Label>
            <Input id="pricePerDay" type="number" placeholder="50000" {...register("pricePerDay")} disabled={createMut.isPending} />
            {errors.pricePerDay && <p className="text-sm text-red-500">{errors.pricePerDay.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit">Deposit Jaminan (Rp)</Label>
            <Input id="deposit" type="number" placeholder="0" {...register("deposit")} disabled={createMut.isPending} />
            {errors.deposit && <p className="text-sm text-red-500">{errors.deposit.message}</p>}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stock">Stok Tersedia</Label>
          <Input id="stock" type="number" placeholder="1" {...register("stock")} disabled={createMut.isPending} />
          {errors.stock && <p className="text-sm text-red-500">{errors.stock.message}</p>}
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-100">
          <Label>Foto Barang (Min 1, Maks 5)</Label>
          
          <div className="flex flex-wrap gap-4">
            {photos.map((photo, i) => (
              <div key={i} className="relative h-24 w-24 rounded-md border border-zinc-200 overflow-hidden group">
                <img src={`/api/files/${photo}`} alt="" className="h-full w-full object-cover" />
                <button 
                  type="button" 
                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  onClick={() => removePhoto(i)}
                >
                  Hapus
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition-colors">
                <div className="text-zinc-500 font-medium text-2xl">+</div>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploadMut.isPending || createMut.isPending} />
              </label>
            )}
          </div>
          {errors.photos && <p className="text-sm text-red-500">{errors.photos.message}</p>}
        </div>

        <div className="pt-4 border-t border-zinc-100">
          <Button type="submit" size="lg" className="w-full" disabled={createMut.isPending || uploadMut.isPending}>
            {createMut.isPending ? "Menyimpan..." : "Simpan Barang"}
          </Button>
        </div>
      </form>
    </div>
  );
}
