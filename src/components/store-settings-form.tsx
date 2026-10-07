"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateStoreSettings } from "@/features/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StoreData {
  name?: string | null;
  tagline?: string | null;
  description?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  openingHours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  qrisImagePath?: string | null;
}

const CITY_PRESETS = [
  { city: "Sragen", lat: -7.4268, lng: 111.0236 },
  { city: "Surakarta", lat: -7.5755, lng: 110.8243 },
  { city: "Semarang", lat: -6.9932, lng: 110.4203 },
  { city: "Yogyakarta", lat: -7.7956, lng: 110.3695 },
];

function whatsappTestLink(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("62") ? digits : digits.startsWith("0") ? `62${digits.slice(1)}` : `62${digits}`;
  const text = encodeURIComponent("Halo, ini uji coba pesan WhatsApp dari toko saya di PinjeS.");
  return `https://wa.me/${normalized}?text=${text}`;
}

export function StoreSettingsForm({ store }: { store: StoreData }) {
  const updateMut = useUpdateStoreSettings();

  const [lat, setLat] = useState<number | null>(store.latitude ?? null);
  const [lng, setLng] = useState<number | null>(store.longitude ?? null);
  const [isLocating, setIsLocating] = useState(false);

  const [qrisPath, setQrisPath] = useState<string | null>(store.qrisImagePath ?? null);
  const [qrisChanged, setQrisChanged] = useState(false);
  const [qrisUploading, setQrisUploading] = useState(false);

  const { register, handleSubmit, setValue, control } = useForm({
    defaultValues: {
      name: store.name || "",
      tagline: store.tagline || "",
      description: store.description || "",
      city: store.city || "",
      address: store.address || "",
      phone: store.phone || "",
      whatsapp: store.whatsapp || "",
      openingHours: store.openingHours || "",
      bankName: store.bankName || "",
      bankAccountNumber: store.bankAccountNumber || "",
      bankAccountName: store.bankAccountName || "",
    },
  });

  const watchedWa = useWatch({ control, name: "whatsapp" });
  const waLink = watchedWa ? whatsappTestLink(watchedWa) : null;

  const setCoords = (newLat: number | null, newLng: number | null) => {
    setLat(newLat);
    setLng(newLng);
  };

  const handleGetCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Browser tidak mendukung geolokasi.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(
          parseFloat(pos.coords.latitude.toFixed(6)),
          parseFloat(pos.coords.longitude.toFixed(6)),
        );
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        toast.error("Akses lokasi GPS ditolak oleh browser.");
      },
    );
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrisUploading(true);
    const fd = new FormData();
    fd.append("kind", "qris");
    fd.append("file", file);

    try {
      const res = await fetch("/api/files/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setQrisPath(json.data.path as string);
      setQrisChanged(true);
      toast.success("QRIS terunggah. Klik Simpan untuk menerapkan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah QRIS.");
    } finally {
      setQrisUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = (data: Record<string, unknown>) => {
    updateMut.mutate({
      ...data,
      latitude: lat,
      longitude: lng,
      ...(qrisChanged ? { qrisImagePath: qrisPath } : {}),
    } as never);
  };

  const hasCoords = lat !== null && lng !== null;
  const delta = 0.008;
  const mapUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik&marker=${lat},${lng}`
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      {/* 1. Profil */}
      <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="border-b border-line pb-3">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">1. Profil toko</h2>
          <p className="text-xs text-muted mt-0.5">Informasi yang dilihat calon penyewa di katalog.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-muted">Nama toko rental</Label>
            <Input id="name" {...register("name")} disabled={updateMut.isPending} placeholder="Nama toko" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline" className="text-xs font-semibold text-muted">Slogan singkat</Label>
            <Input id="tagline" {...register("tagline")} disabled={updateMut.isPending} placeholder="Opsional" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-muted">Deskripsi toko</Label>
            <Textarea
              id="description"
              rows={3}
              {...register("description")}
              disabled={updateMut.isPending}
              placeholder="Ceritakan tentang tokomu dan unit yang disewakan."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="openingHours" className="text-xs font-semibold text-muted">Jam operasional</Label>
            <Input
              id="openingHours"
              {...register("openingHours")}
              disabled={updateMut.isPending}
              placeholder="Contoh: Setiap hari 08:00 - 21:00 WIB"
            />
          </div>
        </div>
      </div>

      {/* 2. Kontak */}
      <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="border-b border-line pb-3">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">2. Kontak toko</h2>
          <p className="text-xs text-muted mt-0.5">
            Penyewa memakai nomor WhatsApp ini untuk menghubungi tokomu.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp" className="text-xs font-semibold text-muted">Nomor WhatsApp toko</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp"
                type="text"
                {...register("whatsapp")}
                disabled={updateMut.isPending}
                placeholder="Contoh: 081234567890"
                className="font-mono text-ink"
              />
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full border border-line bg-canvas text-ink font-semibold text-xs flex items-center shrink-0 hover:border-ink hover:bg-surface transition"
                >
                  Tes WhatsApp
                </a>
              )}
            </div>
            <p className="text-[11px] text-muted">Boleh diawali 08 atau 62.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold text-muted">Telepon alternatif</Label>
            <Input id="phone" {...register("phone")} disabled={updateMut.isPending} placeholder="Opsional" />
          </div>
        </div>
      </div>

      {/* 3. Lokasi */}
      <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="border-b border-line pb-3">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">3. Lokasi toko</h2>
          <p className="text-xs text-muted mt-0.5">Titik ini menunjukkan di mana pelanggan mengambil dan mengembalikan barang.</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold text-muted">Kota</Label>
              <Input id="city" {...register("city")} disabled={updateMut.isPending} placeholder="Contoh: Semarang" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted">Titik GPS</Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleGetCurrentLocation}
                disabled={isLocating || updateMut.isPending}
                className="w-full rounded-full text-xs font-semibold"
              >
                {isLocating ? "Mendeteksi lokasi..." : "Gunakan lokasi saya sekarang"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-muted">Alamat lengkap</Label>
            <Input id="address" {...register("address")} disabled={updateMut.isPending} placeholder="Jalan, nomor, kecamatan" />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-muted font-medium">Isi cepat titik tengah kota:</span>
            {CITY_PRESETS.map((p) => (
              <button
                key={p.city}
                type="button"
                onClick={() => {
                  setCoords(p.lat, p.lng);
                  setValue("city", p.city);
                }}
                className="px-3 py-1 rounded-full bg-canvas border border-line hover:border-ink text-ink font-medium transition"
              >
                {p.city}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="latitude" className="text-muted text-xs">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={lat ?? ""}
                onChange={(e) => setLat(e.target.value === "" ? null : parseFloat(e.target.value))}
                disabled={updateMut.isPending}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longitude" className="text-muted text-xs">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={lng ?? ""}
                onChange={(e) => setLng(e.target.value === "" ? null : parseFloat(e.target.value))}
                disabled={updateMut.isPending}
                className="font-mono text-xs"
              />
            </div>
          </div>

          {mapUrl ? (
            <div className="mt-4 pt-3 border-t border-line">
              <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-line bg-canvas">
                <iframe title="Peta lokasi toko" src={mapUrl} className="w-full h-full border-0" loading="lazy" />
              </div>
              <p className="text-[11px] text-muted mt-2">
                Pastikan pin berada tepat di lokasi tokomu, lalu sesuaikan koordinat kalau perlu.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-muted">Lokasi belum diisi.</p>
          )}
        </div>
      </div>

      {/* 4. Pembayaran */}
      <div className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-xs space-y-6">
        <div className="border-b border-line pb-3">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">4. Pembayaran dari penyewa</h2>
          <p className="text-xs text-muted mt-0.5">
            Penyewa membayar langsung ke rekening atau QRIS ini. Isi minimal salah satunya, kalau tidak pelanggan tidak bisa membayar.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankName" className="text-xs font-semibold text-muted">Nama bank</Label>
            <Input id="bankName" {...register("bankName")} disabled={updateMut.isPending} placeholder="Contoh: BCA, Mandiri, BRI" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankAccountNumber" className="text-xs font-semibold text-muted">Nomor rekening</Label>
            <Input
              id="bankAccountNumber"
              inputMode="numeric"
              {...register("bankAccountNumber")}
              disabled={updateMut.isPending}
              placeholder="Hanya angka"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankAccountName" className="text-xs font-semibold text-muted">Nama pemilik rekening</Label>
            <Input
              id="bankAccountName"
              {...register("bankAccountName")}
              disabled={updateMut.isPending}
              placeholder="Sesuai buku tabungan"
            />
          </div>

          <div className="space-y-2 border-t border-line pt-4">
            <Label className="text-xs font-semibold text-muted">QRIS toko (opsional)</Label>
            {qrisPath ? (
              <div className="flex items-start gap-4">
                <div className="w-40 overflow-hidden rounded-2xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/files/${qrisPath}`} alt="QRIS toko" className="h-auto w-full" />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="qris-upload"
                    className="cursor-pointer rounded-full border border-line bg-canvas px-4 py-2 text-xs font-semibold text-ink hover:border-ink hover:bg-surface transition"
                  >
                    {qrisUploading ? "Mengunggah..." : "Ganti QRIS"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setQrisPath(null);
                      setQrisChanged(true);
                    }}
                    className="text-left text-xs font-semibold text-red-600 hover:underline"
                  >
                    Hapus QRIS
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="qris-upload"
                className="inline-block cursor-pointer rounded-full border border-dashed border-line bg-canvas px-5 py-2.5 text-xs font-semibold text-ink hover:border-ink hover:bg-surface transition"
              >
                {qrisUploading ? "Mengunggah..." : "Pilih gambar QRIS"}
              </label>
            )}
            <input
              id="qris-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleQrisUpload}
              disabled={qrisUploading || updateMut.isPending}
            />
            <p className="text-[11px] text-muted">PNG, JPG, atau WEBP. Perubahan baru berlaku setelah kamu klik Simpan.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={updateMut.isPending || qrisUploading}
          className="rounded-full px-8 h-12 font-semibold text-sm"
        >
          {updateMut.isPending ? "Menyimpan..." : "Simpan pengaturan toko"}
        </Button>
      </div>
    </form>
  );
}